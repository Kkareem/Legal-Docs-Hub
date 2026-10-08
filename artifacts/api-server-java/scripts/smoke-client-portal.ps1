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
 $createdLawyer=Send-Api POST /api/users @{name='Portal smoke lawyer';email="portal-lawyer-$tag@example.com";role='lawyer';password='Temporary-Test-123'} $admin 201
 $userIds+=[long]$createdLawyer.id
 $null=Send-Api POST /api/auth/login @{email="portal-lawyer-$tag@example.com";password='Temporary-Test-123'} $lawyer
 $null=Send-Api POST /api/auth/change-password @{currentPassword='Temporary-Test-123';newPassword='Private-Lawyer-123'} $lawyer
 $first=Send-Api POST /api/clients @{name="Portal smoke $tag";email="portal-client-$tag@example.com";phone='000';status='active'} $admin 201
 $second=Send-Api POST /api/clients @{name="Other portal smoke $tag";email="portal-other-$tag@example.com";phone='000';status='active'} $admin 201
 $clientIds=@([long]$first.id,[long]$second.id)
 $case=Send-Api POST /api/cases @{caseNumber="PORTAL-$tag";type='civil';clientId=$first.id;leadLawyerId=$createdLawyer.id;status='active';court='Synthetic Court'} $admin 201
 $otherCase=Send-Api POST /api/cases @{caseNumber="OTHER-$tag";type='civil';clientId=$second.id;status='active';court='Other Court'} $admin 201
 $caseIds=@([long]$case.id,[long]$otherCase.id)
 $null=Send-Api POST "/api/office-portal/clients/$($second.id)/account" @{email="portal-other-$tag@example.com";password='Temporary-Test-123'} $lawyer 404
 $account=Send-Api POST "/api/office-portal/clients/$($first.id)/account" @{email="portal-client-$tag@example.com";password='Temporary-Test-123'} $lawyer
 $userIds+=[long]$account.id
 $otherAccount=Send-Api POST "/api/office-portal/clients/$($second.id)/account" @{email="portal-other-$tag@example.com";password='Temporary-Test-123'} $admin
 $userIds+=[long]$otherAccount.id
 $null=Send-Api POST "/api/office-portal/clients/$($first.id)/account" @{email="duplicate-$tag@example.com";password='Temporary-Test-123'} $admin 400
 $login=Send-Api POST /api/auth/login @{email="portal-client-$tag@example.com";password='Temporary-Test-123'} $client
 Assert-True ($login.user.role -eq 'client' -and $login.user.mustChangePassword) 'Client onboarding must require a password change'
 $null=Send-Api GET /api/client-portal/overview $null $client 403
 $null=Send-Api POST /api/auth/change-password @{currentPassword='Temporary-Test-123';newPassword='Private-Client-123'} $client
 $null=Send-Api POST /api/auth/login @{email="portal-other-$tag@example.com";password='Temporary-Test-123'} $other
 $null=Send-Api POST /api/auth/change-password @{currentPassword='Temporary-Test-123';newPassword='Private-Other-123'} $other
 foreach($path in @('/api/cases','/api/clients','/api/users','/api/payments','/api/documents','/api/dashboard/summary','/api/office-portal/receipts')){
  $null=Send-Api GET $path $null $client 403
 }
 $overview=Send-Api GET /api/client-portal/overview $null $client
 Assert-True ($overview.cases.Count -eq 1 -and $overview.cases[0].id -eq $case.id) 'Client must only see own cases'
 $null=Send-Api GET "/api/client-portal/cases/$($otherCase.id)" $null $client 404
 $null=Send-Api GET "/api/office-portal/cases/$($otherCase.id)" $null $lawyer 404
 $null=Send-Api POST "/api/office-portal/cases/$($case.id)/updates" @{title='Progress update';body='Synthetic public case progress';status='upcoming_hearing'} $lawyer
 $null=Send-Api POST "/api/office-portal/cases/$($case.id)/hearings" @{datetime=[DateTimeOffset]::UtcNow.AddDays(3).ToString('o');court='Synthetic Court';type='session'} $lawyer
 $detail=Send-Api GET "/api/client-portal/cases/$($case.id)" $null $client
 Assert-True ($detail.updates.Count -eq 1 -and $detail.hearings.Count -eq 1 -and $detail.case.status -eq 'upcoming_hearing') 'Progress and hearings must reach the client'
 $uploaded=@(Send-Api POST "/api/client-portal/cases/$($case.id)/files" $null $client 200 @{files=@((Get-Item $textPath),(Get-Item $binaryPath))})
 Assert-True ($uploaded.Count -eq 2) 'Multiple file types must upload together'
 $fileId=[long]$uploaded[0].id
 $download=Invoke-WebRequest "$BaseUrl/api/client-portal/documents/$fileId/content" -WebSession $client -TimeoutSec 10
 Assert-True ($download.StatusCode -eq 200 -and $download.Headers['Content-Disposition'] -match 'attachment') 'Owned attachment must download safely'
 $null=Send-Api GET "/api/client-portal/documents/$fileId/content" $null $other 404
 $null=Send-Api PATCH "/api/documents/$fileId" @{clientId=$second.id} $admin 400
 $null=Send-Api DELETE "/api/documents/$fileId" $null $admin 400
 $staffDownload=Invoke-WebRequest "$BaseUrl/api/office-portal/documents/$fileId/content" -WebSession $lawyer -TimeoutSec 10
 Assert-True ($staffDownload.StatusCode -eq 200) 'Assigned lawyer must access client attachments'
 $null=Send-Api POST "/api/client-portal/cases/$($otherCase.id)/files" $null $client 404 @{files=(Get-Item $textPath)}
 $payment=Send-Api POST "/api/office-portal/cases/$($case.id)/payments" @{amount=123.45;notes='Synthetic fees'} $lawyer
 $otherPayment=Send-Api POST "/api/office-portal/cases/$($otherCase.id)/payments" @{amount=999;notes='Other client fees'} $admin
 $overview=Send-Api GET /api/client-portal/overview $null $client
 Assert-True ($overview.payments.Count -eq 1 -and $overview.payments[0].id -eq $payment.id) 'Payments must be isolated per client'
 $null=Send-Api PUT /api/office-portal/bank @{bankName='Test';beneficiary='Test';iban='INVALID'} $admin 400
 $null=Send-Api GET /api/office-portal/bank $null $lawyer 403
 $null=Send-Api POST "/api/client-portal/payments/$($otherPayment.id)/receipt" $null $client 404 @{reference='wrong owner';file=(Get-Item $textPath)}
 $null=Send-Api POST "/api/client-portal/payments/$($payment.id)/receipt" $null $client 200 @{reference='TEST-TRANSFER';file=(Get-Item $textPath)}
 $null=Send-Api POST "/api/client-portal/payments/$($payment.id)/receipt" $null $client 400 @{reference='duplicate';file=(Get-Item $textPath)}
 $overview=Send-Api GET /api/client-portal/overview $null $client
 Assert-True ($overview.payments[0].status -eq 'under_review') 'Receipt upload must not mark payment paid'
 $receiptId=[long]$overview.payments[0].receipts[0].id
 $null=Send-Api POST "/api/office-portal/receipts/$receiptId/review" @{approve=$true;notes='forbidden'} $client 403
 $null=Send-Api POST "/api/office-portal/receipts/$receiptId/review" @{approve=$true;notes='forbidden'} $lawyer 403
 $null=Send-Api POST "/api/office-portal/receipts/$receiptId/review" @{approve=$false;notes='Synthetic rejection'} $admin
 $overview=Send-Api GET /api/client-portal/overview $null $client
 Assert-True ($overview.payments[0].status -eq 'pending' -and $overview.payments[0].receipts[0].review_notes -eq 'Synthetic rejection') 'Rejected receipt should reopen payment and show notes'
 $null=Send-Api POST "/api/client-portal/payments/$($payment.id)/receipt" $null $client 200 @{reference='RETRY-TRANSFER';file=(Get-Item $binaryPath)}
 $overview=Send-Api GET /api/client-portal/overview $null $client
 $receiptId=[long]$overview.payments[0].receipts[0].id
 $null=Send-Api POST "/api/office-portal/receipts/$receiptId/review" @{approve=$true;notes='Synthetic verified receipt'} $admin
 $null=Send-Api POST "/api/office-portal/receipts/$receiptId/review" @{approve=$true;notes='duplicate'} $admin 400
 $overview=Send-Api GET /api/client-portal/overview $null $client
 Assert-True ($overview.payments[0].status -eq 'paid' -and $null -ne $overview.payments[0].paid_at) 'Only approved receipt should confirm payment'
 $null=Send-Api POST "/api/client-portal/payments/$($payment.id)/receipt" $null $client 400 @{reference='already paid';file=(Get-Item $textPath)}
 $newConsult=Send-Api POST /api/client-portal/consultations @{summary='Synthetic client consultation for own case';caseId=$case.id} $client
 $requestIds+=[long]$newConsult.id
 $null=Send-Api POST /api/client-portal/consultations @{summary='Unauthorized foreign case consultation';caseId=$otherCase.id} $client 404
 $null=Send-Api POST "/api/client-portal/consultations/$($newConsult.id)/reply" @{response='Too early'} $client 400
 $null=Send-Api POST "/api/consultation-requests/$($newConsult.id)/reply" @{response='Synthetic consultation answer'} $lawyer
 $null=Send-Api POST "/api/client-portal/consultations/$($newConsult.id)/reply" @{response='Client follow-up'} $other 404
 $null=Send-Api POST "/api/client-portal/consultations/$($newConsult.id)/reply" @{response='Client follow-up'} $client
 $public=Send-Api POST /api/public/consultations @{name='Synthetic visitor';email="visitor-$tag@example.com";phone='000';summary='Synthetic consultation to explicitly claim'} $null 201
 $requestIds+=[long]$public.id
 $null=Send-Api POST /api/client-portal/consultations/link @{id=$public.id;token=[guid]::NewGuid().ToString()} $client 404
 $null=Send-Api POST /api/client-portal/consultations/link @{id=$public.id;token=$public.token} $client
 $null=Send-Api POST /api/client-portal/consultations/link @{id=$public.id;token=$public.token} $other 404
 $preferences=Send-Api GET /api/notifications/preferences $null $client
 Assert-True ($preferences.site_enabled) 'Site notifications default on'
 $notices=Send-Api GET /api/notifications $null $client
 Assert-True ($notices.Count -gt 0) 'Case, payment and consultation events should notify the client'
 $noticeId=$notices[0].id
 $null=Send-Api PATCH "/api/notifications/$noticeId/read" @{} $other 404
 $null=Send-Api PATCH "/api/notifications/$noticeId/read" @{} $client
 $null=Send-Api GET /api/settings/email $null $client 403
 $null=Send-Api PUT /api/settings/email @{enabled=$false;email='';password=$null} $lawyer 403
 $null=Send-Api POST /api/notifications/subscriptions @{endpoint='https://127.0.0.1/private';p256dh='invalid';auth='invalid'} $client 400
 $configuration=Send-Api GET /api/settings/application $null $client
 Assert-True ($configuration.currency.Length -eq 3 -and $configuration.pushPublicKey.Length -gt 80) 'Runtime currency and Web Push public key should be available'
 $before=$notices.Count
 $null=Send-Api PUT /api/notifications/preferences @{siteEnabled=$false;emailEnabled=$false;browserEnabled=$false} $client
 $null=Send-Api POST "/api/office-portal/cases/$($case.id)/updates" @{title='Muted event';body='Should not notify muted client';status='active'} $lawyer
 $after=Send-Api GET /api/notifications $null $client
 Assert-True ($after.Count -eq $before) 'All disabled channels suppress new notifications'
 $otherPrefs=Send-Api GET /api/notifications/preferences $null $other
 Assert-True ($otherPrefs.site_enabled) 'Preferences must be scoped to the current user'
 $null=Send-Api PUT /api/notifications/preferences @{siteEnabled=$true;emailEnabled=$true;browserEnabled=$false} $client
 $overview=Send-Api GET /api/client-portal/overview $null $client
 Assert-True ($overview.requests.Count -eq 2) 'Owned and explicitly claimed consultations should appear'
 $null=Send-Api POST "/api/client-portal/cases/$($case.id)/review" @{stars=5;comment='Too early'} $client 400
 $null=Send-Api POST "/api/office-portal/cases/$($case.id)/updates" @{title='Case closed';body='Synthetic case closure';status='closed'} $lawyer
 $null=Send-Api POST "/api/client-portal/cases/$($case.id)/review" @{stars=6;comment='Invalid score'} $client 400
 $null=Send-Api POST "/api/client-portal/cases/$($case.id)/review" @{stars=5;comment='Synthetic client review'} $other 404
 $null=Send-Api POST "/api/client-portal/cases/$($case.id)/review" @{stars=5;comment='Synthetic client review'} $client
 $null=Send-Api POST "/api/client-portal/cases/$($case.id)/review" @{stars=4;comment='Duplicate'} $client 400
 $detail=Send-Api GET "/api/office-portal/cases/$($case.id)" $null $lawyer
 Assert-True ($detail.reviews.Count -eq 1 -and $detail.reviews[0].stars -eq 5 -and $detail.files.Count -eq 2) 'Lawyer should see closed-case rating and all uploaded attachments'
 $general=Send-Api POST "/api/office-portal/clients/$($first.id)/payments" @{amount=25;notes='Synthetic general payment request'} $admin
 $overview=Send-Api GET /api/client-portal/overview $null $client
 Assert-True ($overview.payments.Count -eq 2 -and $overview.payments.id -contains $general.id) 'General payment requests should also appear in the client portal'
 Write-Output 'PASS: client onboarding, API isolation, progress, hearings, multiple file types, bank receipt review, payment confirmation, owned consultation threads, closed-case ratings.'
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
