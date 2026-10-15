# JWT, OTP and contact-linking checks run in an isolated PostgreSQL schema.
# Email delivery is mocked: this command sends no external email or SMS.
param([string]$MavenRepository = '')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$previousFlag=$env:LEGALDESK_INTEGRATION_TESTS
try {
 $env:LEGALDESK_INTEGRATION_TESTS='true'
 $arguments=@('-f',(Join-Path $projectRoot 'pom.xml'),'-pl','legaldesk-app','-am','test','-Dtest=IdentityJwtConsultationIntegrationTest','-Dsurefire.failIfNoSpecifiedTests=false')
 if($MavenRepository){$arguments += "-Dmaven.repo.local=$MavenRepository"}
 & mvn @arguments
 if($LASTEXITCODE -ne 0){throw 'Identity / JWT / OTP integration checks failed'}
} finally {$env:LEGALDESK_INTEGRATION_TESTS=$previousFlag}
