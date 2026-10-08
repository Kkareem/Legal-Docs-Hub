param(
    [string]$BaseUrl = 'http://localhost:4020',
    [string]$AdminEmail = 'admin@legaldesk.sa',
    [string]$AdminPassword = 'password123'
)
$ErrorActionPreference = 'Stop'
Import-Module Microsoft.PowerShell.Utility
$adminSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$lawyerSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$otherSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
$testTag = [guid]::NewGuid().ToString('N')
$visitor = [guid]::NewGuid().ToString()
$email = "smoke-$testTag@example.com"
$otherEmail = "smoke-other-$testTag@example.com"
$lawyerId = $null
$otherId = $null
$requestId = $null
function Send-Api($Method, $Path, $Body, $Session, $Expected = 200) {
    Write-Output "CHECK $Method $Path (expected $Expected)" | Out-Host
    $options = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        SkipHttpErrorCheck = $true
        ContentType = 'application/json'
        TimeoutSec = 15
    }
    if ($null -ne $Body) { $options.Body = $Body | ConvertTo-Json -Depth 10 }
    if ($null -ne $Session) { $options.WebSession = $Session }
    $result = Invoke-WebRequest @options
    if ([int]$result.StatusCode -ne $Expected) {
        throw "$Method $Path expected $Expected, received $($result.StatusCode): $($result.Content)"
    }
    if ($result.Content) { return $result.Content | ConvertFrom-Json }
}
function Assert-True($Condition, $Message) {
    if (!$Condition) { throw $Message }
}
try {
    $adminLogin = Send-Api POST /api/auth/login @{email=$AdminEmail;password=$AdminPassword} $adminSession
    $initial = Send-Api GET /api/dashboard/summary $null $adminSession
    $null = Send-Api POST /api/public/visits @{visitorId=$visitor} $null 204
    $null = Send-Api POST /api/public/visits @{visitorId=$visitor} $null 204
    $after = Send-Api GET /api/dashboard/summary $null $adminSession
    Assert-True ($after.totalVisitors -eq ($initial.totalVisitors + 1)) 'Visitor should count once'
    $null = Send-Api POST /api/public/consultations @{name='Invalid';email='bad';phone='0';summary='short'} $null 400
    $receipt = Send-Api POST /api/public/consultations @{name='Smoke visitor';email=$email;phone='0000000000';summary='Synthetic test consultation; no real legal information.'} $null 201
    $requestId = [long]$receipt.id
    $null = Send-Api POST /api/public/consultations/reply @{id=$requestId;token=$receipt.token;response='Too early'} $null 400
    $null = Send-Api POST /api/public/consultations/track @{id=$requestId;token=[guid]::NewGuid().ToString()} $null 404
    $null = Send-Api GET /api/consultation-requests $null $null 403
    $created = Send-Api POST /api/users @{name='Smoke lawyer';email=$email;phone='000';password='Temporary-Test-123';role='lawyer'} $adminSession 201
    $lawyerId = [long]$created.id
    $null = Send-Api POST /api/users @{name='Duplicate';email=$email.ToUpperInvariant();password='Temporary-Test-123';role='lawyer'} $adminSession 400
    $login = Send-Api POST /api/auth/login @{email=$email;password='Temporary-Test-123'} $lawyerSession
    Assert-True $login.user.mustChangePassword 'New lawyer must change password'
    $null = Send-Api GET /api/dashboard/summary $null $lawyerSession 403
    $null = Send-Api POST /api/auth/change-password @{currentPassword='wrong';newPassword='Private-Test-123'} $lawyerSession 401
    $null = Send-Api POST /api/auth/change-password @{currentPassword='Temporary-Test-123';newPassword='Temporary-Test-123'} $lawyerSession 400
    $changed = Send-Api POST /api/auth/change-password @{currentPassword='Temporary-Test-123';newPassword='Private-Test-123'} $lawyerSession
    Assert-True (!$changed.mustChangePassword) 'Password requirement should clear'
    $null = Send-Api GET /api/dashboard/summary $null $lawyerSession
    $null = Send-Api POST /api/users @{name='Unauthorized';email='forbidden@example.com';password='Temporary-Test-123';role='admin'} $lawyerSession 403
    $null = Send-Api POST "/api/consultation-requests/$requestId/reply" @{response='Not assigned'} $lawyerSession 404
    $null = Send-Api PATCH "/api/consultation-requests/$requestId/assign" @{assignedTo=$lawyerId} $lawyerSession 403
    $null = Send-Api PATCH "/api/consultation-requests/$requestId/assign" @{assignedTo=$lawyerId} $adminSession
    $assigned = @(Send-Api GET /api/consultation-requests $null $lawyerSession)
    Assert-True ($assigned.id -contains $requestId) 'Assigned consultation must be visible'
    $other = Send-Api POST /api/users @{name='Other smoke lawyer';email=$otherEmail;password='Temporary-Test-123';role='lawyer'} $adminSession 201
    $otherId = [long]$other.id
    $null = Send-Api POST /api/auth/login @{email=$otherEmail;password='Temporary-Test-123'} $otherSession
    $null = Send-Api POST /api/auth/change-password @{currentPassword='Temporary-Test-123';newPassword='Private-Test-456'} $otherSession
    $hidden = @(Send-Api GET /api/consultation-requests $null $otherSession)
    Assert-True (!($hidden.id -contains $requestId)) 'Other lawyer must not see consultation'
    $null = Send-Api POST "/api/consultation-requests/$requestId/reply" @{response='Other lawyer'} $otherSession 404
    $null = Send-Api PATCH "/api/consultation-requests/$requestId/assign" @{assigneeIds=@($lawyerId,$otherId,$lawyerId)} $adminSession
    $shared = @(Send-Api GET /api/consultation-requests $null $otherSession)
    Assert-True ($shared.id -contains $requestId) 'Second assignee must see the shared consultation'
    $primary = @(Send-Api GET /api/consultation-requests $null $lawyerSession)
    Assert-True ($primary.id -contains $requestId) 'First assignee must still see the shared consultation'
    $allRequests = @(Send-Api GET /api/consultation-requests $null $adminSession)
    Assert-True (($allRequests | Where-Object id -eq $requestId).assignees.Count -eq 2) 'Admin should see both assignees, with duplicates removed'
    $null = Send-Api PATCH "/api/consultation-requests/$requestId/assign" @{assigneeIds=@($lawyerId,0)} $adminSession 404
    $unchanged = @(Send-Api GET /api/consultation-requests $null $otherSession)
    Assert-True ($unchanged.id -contains $requestId) 'Invalid assignment must not remove existing assignees'
    $null = Send-Api PATCH "/api/consultation-requests/$requestId/assign" @{assigneeIds=@($otherId)} $adminSession
    $removed = @(Send-Api GET /api/consultation-requests $null $lawyerSession)
    Assert-True (!($removed.id -contains $requestId)) 'Removed assignee must no longer see the request'
    $null = Send-Api POST "/api/consultation-requests/$requestId/reply" @{response='Removed lawyer'} $lawyerSession 404
    $null = Send-Api PATCH "/api/consultation-requests/$requestId/assign" @{assigneeIds=@($lawyerId,$otherId)} $adminSession
    $null = Send-Api POST "/api/consultation-requests/$requestId/reply" @{response='Synthetic lawyer reply'} $lawyerSession
    $tracked = Send-Api POST /api/public/consultations/track @{id=$requestId;token=$receipt.token} $null
    Assert-True ($tracked.response -eq 'Synthetic lawyer reply' -and $tracked.status -eq 'answered') 'Visitor should see lawyer reply'
    Assert-True ($tracked.canReply -and $tracked.messages.Count -eq 1) 'Visitor reply should open and staff reply should be in history'
    Assert-True ($tracked.messages[0].sender_name -eq 'Smoke lawyer') 'Each reply must identify its actual author'
    $officeRequests = @(Send-Api GET /api/consultation-requests $null $lawyerSession)
    Assert-True (!(($officeRequests | Where-Object id -eq $requestId).canReply)) 'Staff reply should close after sending'
    $null = Send-Api POST "/api/consultation-requests/$requestId/reply" @{response='Duplicate staff reply'} $lawyerSession 400
    $null = Send-Api POST "/api/consultation-requests/$requestId/reply" @{response='Duplicate admin reply'} $adminSession 400
    $null = Send-Api POST /api/public/consultations/reply @{id=$requestId;token=[guid]::NewGuid().ToString();response='Wrong token'} $null 404
    $replyUrl = "$BaseUrl/api/public/consultations/reply"
    $replyBody = @{id=$requestId;token=$receipt.token;response='Synthetic visitor follow-up'} | ConvertTo-Json
    $concurrentStatuses = @(1,2 | ForEach-Object -Parallel {
        $response = Invoke-WebRequest -Uri $using:replyUrl -Method POST -ContentType application/json -Body $using:replyBody -SkipHttpErrorCheck -TimeoutSec 15
        [int]$response.StatusCode
    } -ThrottleLimit 2)
    Assert-True (($concurrentStatuses | Where-Object { $_ -eq 200 }).Count -eq 1) 'Only one concurrent visitor reply should succeed'
    Assert-True (($concurrentStatuses | Where-Object { $_ -eq 400 }).Count -eq 1) 'Concurrent duplicate reply must be rejected'
    $tracked = Send-Api POST /api/public/consultations/track @{id=$requestId;token=$receipt.token} $null
    Assert-True (!$tracked.canReply -and $tracked.status -eq 'pending' -and $tracked.messages.Count -eq 2) 'Visitor should wait after sending, and history should remain intact'
    $officeRequests = @(Send-Api GET /api/consultation-requests $null $lawyerSession)
    Assert-True (($officeRequests | Where-Object id -eq $requestId).canReply) 'Staff reply should reopen after visitor follow-up'
    $null = Send-Api POST "/api/consultation-requests/$requestId/reply" @{response='Synthetic admin reply'} $adminSession
    $tracked = Send-Api POST /api/public/consultations/track @{id=$requestId;token=$receipt.token} $null
    Assert-True ($tracked.response -eq 'Synthetic admin reply') 'Admin should be able to reply directly'
    Assert-True ($tracked.messages[2].sender_name -eq $adminLogin.user.name) 'Admin replies must identify the admin'
    Assert-True ($tracked.messages.Count -eq 3 -and $tracked.messages[0].body -eq 'Synthetic lawyer reply' -and $tracked.messages[1].sender_type -eq 'visitor') 'Conversation must preserve every message in order'
    $null = Send-Api POST /api/public/consultations/reply @{id=$requestId;token=$receipt.token;response='Second visitor follow-up'} $null
    $null = Send-Api POST "/api/consultation-requests/$requestId/reply" @{response='Second lawyer reply'} $otherSession
    $tracked = Send-Api POST /api/public/consultations/track @{id=$requestId;token=$receipt.token} $null
    Assert-True ($tracked.messages.Count -eq 5 -and $tracked.canReply) 'Multiple conversation rounds should work'
    Assert-True ($tracked.messages[4].sender_name -eq 'Other smoke lawyer' -and $tracked.messages[0].sender_name -eq 'Smoke lawyer') 'Shared conversation must retain distinct author names for both lawyers'
    $null = Send-Api POST /api/auth/logout @{} $lawyerSession
    $null = Send-Api POST /api/auth/login @{email=$email;password='Temporary-Test-123'} $lawyerSession 401
    $login = Send-Api POST /api/auth/login @{email=$email;password='Private-Test-123'} $lawyerSession
    Assert-True (!$login.user.mustChangePassword) 'New password should work after logout'
    Write-Output "PASS ($BaseUrl): onboarding, password enforcement, roles, assignment isolation, public tracking, alternating conversation turns, concurrent duplicate rejection, message history, visitor deduplication."
} finally {
    # Only synthetic fixtures created by this run are removed from the local Compose database.
    $cleanup = "DELETE FROM site_visitors WHERE visitor_id='$visitor';"
    if ($null -ne $requestId) { $cleanup += "DELETE FROM consultation_requests WHERE id=$requestId;" }
    if ($null -ne $lawyerId) { $cleanup += "DELETE FROM users WHERE id=$lawyerId AND email='$email';" }
    if ($null -ne $otherId) { $cleanup += "DELETE FROM users WHERE id=$otherId AND email='$otherEmail';" }
    Push-Location (Join-Path $PSScriptRoot '..')
    try {
        docker compose exec -T postgres psql -U legaldesk -d legaldesk -v ON_ERROR_STOP=1 -c $cleanup
        if ($LASTEXITCODE -ne 0) { Write-Warning 'Synthetic fixture cleanup failed.' }
    } finally { Pop-Location }
}
