param([string]$BaseUrl='http://127.0.0.1:8080',[string]$AdminEmail='admin@legaldesk.sa',[string]$AdminPassword='password123')
$ErrorActionPreference='Stop'
Import-Module Microsoft.PowerShell.Utility
$admin=[Microsoft.PowerShell.Commands.WebRequestSession]::new()
$lawyer=[Microsoft.PowerShell.Commands.WebRequestSession]::new()
$client=[Microsoft.PowerShell.Commands.WebRequestSession]::new()
$other=[Microsoft.PowerShell.Commands.WebRequestSession]::new()
$tag=[guid]::NewGuid().ToString('N')
$clientIds=@();$userIds=@();$caseIds=@();$requestIds=@()
$tempDirectory=Join-Path ([IO.Path]::GetTempPath()) "legaldesk-portal-$tag"
New-Item -ItemType Directory -Path $tempDirectory | Out-Null
$textPath=Join-Path $tempDirectory 'evidence.txt'
$binaryPath=Join-Path $tempDirectory 'evidence.bin'
[IO.File]::WriteAllText($textPath,'Synthetic portal attachment')
[IO.File]::WriteAllBytes($binaryPath,[byte[]](0,1,2,255))
function Assert-True($Condition,$Message){if(!$Condition){throw $Message}}
function Send-Api($Method,$Path,$Body,$Session,$Expected=200,$Form=$null){
 Write-Output "CHECK $Method $Path ($Expected)" | Out-Host
 $options=@{Uri="$BaseUrl$Path";Method=$Method;SkipHttpErrorCheck=$true;TimeoutSec=20}
 if($Session){$options.WebSession=$Session}
 if($null -ne $Form){$options.Form=$Form}
 elseif($null -ne $Body){$options.ContentType='application/json';$options.Body=$Body|ConvertTo-Json -Depth 15}
 $result=Invoke-WebRequest @options
 if([int]$result.StatusCode -ne $Expected){throw "$Method $Path expected $Expected got $($result.StatusCode): $($result.Content)"}
 if($result.Content){return $result.Content|ConvertFrom-Json}
}
try {

 $null=Send-Api POST /api/auth/login @{email=$AdminEmail;password=$AdminPassword} $admin
 $sessions=@();$lawyers=@();$accounts=@();$clients=@()
 for($i=0;$i -lt 3;$i++){
  $session=[Microsoft.PowerShell.Commands.WebRequestSession]::new()
  $u=Send-Api POST /api/users @{name="Participants lawyer $i";email="participants-$i-$tag@example.com";role='lawyer';password='Temporary-Test-123'} $admin 201
  $userIds+=[long]$u.id;$lawyers+=$u;$sessions+=$session
  $null=Send-Api POST /api/auth/login @{email=$u.email;password='Temporary-Test-123'} $session
  $null=Send-Api POST /api/auth/change-password @{currentPassword='Temporary-Test-123';newPassword='Private-Lawyer-123'} $session
  $c=Send-Api POST /api/clients @{name="Participants client $i $tag";email="participant-client-$i-$tag@example.com";status='active'} $admin 201
  $clientIds+=[long]$c.id;$clients+=$c
  $account=Send-Api POST "/api/office-portal/clients/$($c.id)/account" @{email=$c.email;password='Temporary-Test-123'} $admin
  $userIds+=[long]$account.id;$cs=[Microsoft.PowerShell.Commands.WebRequestSession]::new();$accounts+=$cs
  $null=Send-Api POST /api/auth/login @{email=$c.email;password='Temporary-Test-123'} $cs
  $null=Send-Api POST /api/auth/change-password @{currentPassword='Temporary-Test-123';newPassword='Private-Client-123'} $cs
 }
 $case=Send-Api POST /api/cases @{caseNumber="PARTICIPANTS-$tag";type='civil';clientIds=@($clients[0].id,$clients[1].id);lawyerIds=@($lawyers[0].id,$lawyers[1].id);status='active'} $admin 201
 $caseIds+= [long]$case.id;$id=$case.id
 Assert-True ($case.clients.Count -eq 2 -and $case.lawyers.Count -eq 2) 'Multiple case participants'
 foreach($session in $sessions[0..1]){$null=Send-Api GET "/api/cases/$id" $null $session}
 $null=Send-Api GET "/api/cases/$id" $null $sessions[2] 404
 $list=Send-Api GET /api/cases $null $sessions[2];Assert-True ($list.id -notcontains $id) 'Unassigned case must not be listed'
 foreach($session in $accounts[0..1]){$overview=Send-Api GET /api/client-portal/overview $null $session;Assert-True ($overview.cases.id -contains $id) 'Every linked client sees case'}
 $null=Send-Api GET "/api/client-portal/cases/$id" $null $accounts[2] 404
 $null=Send-Api POST "/api/cases/$id/opponents" @{} $sessions[0]
 $opponent=Send-Api POST "/api/cases/$id/opponents" @{name='Opponent';phone='123';email='opponent@example.com';nationalId='000';relationship='Business partner';relatedClientId=$clients[1].id} $sessions[1]
 $null=Send-Api PUT "/api/cases/$id/opponents/$($opponent.id)" @{name='Updated opponent';relatedClientId=$clients[0].id} $sessions[0]
 $null=Send-Api POST "/api/cases/$id/opponents" @{relatedClientId=$clients[2].id} $admin 400
 $null=Send-Api GET "/api/cases/$id/opponents" $null $accounts[0] 403
 $null=Send-Api GET "/api/cases/$id/opponents" $null $sessions[2] 404
 $activity=Send-Api GET "/api/cases/$id/activity" $null $admin
 $event=$activity|Where-Object {$_.entity -eq 'case_opponents' -and $_.action -eq 'UPDATE'}|Select-Object -First 1
 Assert-True ($event.actor_id -eq $lawyers[0].id -and $event.actor_name -eq $lawyers[0].name) 'Audit must capture actual authenticated actor'
 $changes=$event.changes|ConvertFrom-Json;Assert-True ($changes.name.before -eq 'Opponent' -and $changes.name.after -eq 'Updated opponent') 'Audit exact before/after values'
 $null=Send-Api POST "/api/office-portal/cases/$id/updates" @{title='Shared update';body='Shared case progress';status='active'} $sessions[1]
 $null=Send-Api POST "/api/office-portal/cases/$id/hearings" @{datetime=[DateTimeOffset]::UtcNow.AddDays(3).ToString('o');court='Test';type='session'} $sessions[1]
 $uploaded=@(Send-Api POST "/api/client-portal/cases/$id/files" $null $accounts[1] 200 @{files=@((Get-Item $textPath),(Get-Item $binaryPath))})
 $null=Send-Api GET "/api/client-portal/documents/$($uploaded[0].id)/content" $null $accounts[2] 404
 $response=Invoke-WebRequest "$BaseUrl/api/client-portal/documents/$($uploaded[0].id)/content" -WebSession $accounts[0];Assert-True ($response.StatusCode -eq 200) 'Attachments shared between linked clients'
 $null=Send-Api GET /api/documents $null $sessions[2]
 $null=Send-Api GET "/api/documents/$($uploaded[0].id)" $null $sessions[2] 404
 $null=Send-Api POST "/api/office-portal/cases/$id/payments" @{amount=10;notes='Missing payer'} $admin 400
 $payment=Send-Api POST "/api/office-portal/cases/$id/payments" @{clientId=$clients[1].id;amount=10;notes='Second payer'} $sessions[0]
 $null=Send-Api POST "/api/office-portal/cases/$id/payments" @{clientId=$clients[2].id;amount=10;notes='Invalid payer'} $admin 400
 $first=Send-Api GET "/api/client-portal/cases/$id" $null $accounts[0]
 $second=Send-Api GET "/api/client-portal/cases/$id" $null $accounts[1]
 Assert-True ($first.payments.Count -eq 0 -and $second.payments.Count -eq 1) 'Payments scoped to payer within shared case'
 Assert-True ($first.clients.Count -eq 0 -and $second.clients.Count -eq 0) 'Other clients identities not exposed'
 Assert-True ($first.files.Count -eq 2 -and $first.hearings.Count -eq 1 -and $first.updates.Count -eq 1) 'Shared case progress'
 $null=Send-Api POST "/api/office-portal/cases/$id/updates" @{title='Closed';body='Closed for rating';status='closed'} $sessions[0]
 foreach($session in $accounts[0..1]){foreach($l in $lawyers[0..1]){$null=Send-Api POST "/api/client-portal/cases/$id/review" @{lawyerId=$l.id;stars=5;comment='Synthetic'} $session}}
 $null=Send-Api POST "/api/client-portal/cases/$id/review" @{lawyerId=$lawyers[0].id;stars=4} $accounts[0] 400
 $all=Send-Api GET "/api/office-portal/cases/$id" $null $admin;Assert-True ($all.reviews.Count -eq 4) 'Each client may rate each assigned lawyer once'
 $null=Send-Api PATCH "/api/cases/$id" @{clientIds=@($clients[0].id);lawyerIds=@($lawyers[0].id)} $admin
 $null=Send-Api GET "/api/client-portal/cases/$id" $null $accounts[1] 404
 $null=Send-Api GET "/api/cases/$id" $null $sessions[1] 404
 $null=Send-Api GET "/api/office-portal/cases/$id" $null $sessions[1] 404
 $activity=Send-Api GET "/api/cases/$id/activity" $null $admin
 Assert-True (-not ($activity.changes -match 'tracking_token|"content"')) 'Audit excludes tokens and binary payloads'
 Write-Output 'PASS: multi-client/lawyer access, shared progress/files, private payments, optional opponents, actor audit, per-client/lawyer ratings, access revocation.'
} finally {
 Push-Location (Join-Path $PSScriptRoot '..')
 try {
  $sql=''
  if($caseIds.Count){$ids=$caseIds -join ',';$sql+="DELETE FROM notifications WHERE (ref_type='case' AND ref_id IN ($ids));"}
  if($requestIds.Count){$ids=$requestIds -join ',';$sql+="DELETE FROM notifications WHERE ref_type='consultation' AND ref_id IN ($ids);"}
  if($clientIds.Count){$ids=$clientIds -join ',';$sql+="DELETE FROM notifications WHERE ref_type='payment' AND ref_id IN (SELECT id FROM payments WHERE client_id IN ($ids));"}
  if($requestIds.Count){$sql+="DELETE FROM consultation_requests WHERE id IN ($($requestIds -join ','));"}
  if($clientIds.Count){$ids=$clientIds -join ',';$sql+="DELETE FROM payment_receipts WHERE payment_id IN (SELECT id FROM payments WHERE client_id IN ($ids));DELETE FROM documents WHERE client_id IN ($ids);"}
  if($caseIds.Count){$ids=$caseIds -join ',';$sql+="DELETE FROM hearings WHERE case_id IN ($ids);DELETE FROM payments WHERE case_id IN ($ids);DELETE FROM cases WHERE id IN ($ids);"}
 if($clientIds.Count){$ids=$clientIds -join ',';$sql+="DELETE FROM payments WHERE client_id IN ($ids);DELETE FROM clients WHERE id IN ($ids);"}
  if($userIds.Count){$sql+="DELETE FROM users WHERE id IN ($($userIds -join ','));"}
  if($caseIds.Count){$sql+="DELETE FROM case_activity WHERE case_id IN ($($caseIds -join ','));"}
  if($sql){docker compose exec -T postgres psql -U legaldesk -d legaldesk -v ON_ERROR_STOP=1 -c $sql;if($LASTEXITCODE -ne 0){throw 'Synthetic fixture cleanup failed; run cleanup with Docker access'}}
 } finally {Pop-Location}
 foreach($path in @($textPath,$binaryPath)){if(Test-Path -LiteralPath $path){Remove-Item -LiteralPath $path}}
 if(Test-Path -LiteralPath $tempDirectory){Remove-Item -LiteralPath $tempDirectory}
}
