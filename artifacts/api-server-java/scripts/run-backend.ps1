param(
    [ValidateSet('dev','stg','prod')][string]$Profile='dev',
    [switch]$Debug,
    [int]$DebugPort=0,
    [int]$Port=0,
    [switch]$SkipBuild
)
$ErrorActionPreference='Stop'
$backendRoot=Split-Path $PSScriptRoot -Parent
$environmentFile=Join-Path $backendRoot ".env.$Profile"
if(Test-Path -LiteralPath $environmentFile){
    foreach($line in Get-Content -LiteralPath $environmentFile){
        if($line -match '^\s*([A-Z][A-Z0-9_]*)=(.*)$'){
            $key=$Matches[1];$value=$Matches[2].Trim()
            if(($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))){$value=$value.Substring(1,$value.Length-2)}
            [Environment]::SetEnvironmentVariable($key,$value,'Process')
        }
    }
}elseif($Profile -ne 'dev'){
    throw "Copy .env.$Profile.example to .env.$Profile and configure this environment before running it."
}
$env:SPRING_PROFILES_ACTIVE=$Profile
if($Port -gt 0){$env:PORT=$Port}
Push-Location $backendRoot
try{
    if(-not $SkipBuild){
        & mvn "-P$Profile" -pl legaldesk-app -am install '-DskipTests'
        if($LASTEXITCODE -ne 0){throw 'Maven build failed'}
    }
    Push-Location (Join-Path $backendRoot 'legaldesk-app')
    try{
        $runArguments=@("-P$Profile",'spring-boot:run')
        if($Debug){
            if($DebugPort -eq 0){$DebugPort=@{dev=5005;stg=5006;prod=5007}[$Profile]}
            if($DebugPort -lt 1024 -or $DebugPort -gt 65535){throw 'DebugPort must be between 1024 and 65535'}
            $runArguments+="-Dspring-boot.run.jvmArguments=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=127.0.0.1:$DebugPort"
        }
        & mvn @runArguments
        if($LASTEXITCODE -ne 0){throw 'Backend startup failed'}
    }finally{Pop-Location}
}finally{Pop-Location}
