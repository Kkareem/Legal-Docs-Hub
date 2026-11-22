package com.legaldesk;
import static org.mockito.Mockito.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import com.legaldesk.modules.auth.application.AccountMessageWorker;
import com.legaldesk.modules.notifications.application.NotificationSettingsService;

class AccountMessageWorkerTest {
 @Test void sendsSnapshotToPreviousAddressAndMarksDeliverySent(){
  var jdbc=mock(JdbcTemplate.class);var mail=mock(NotificationSettingsService.class);when(mail.emailEnabled()).thenReturn(true);
  when(jdbc.queryForList(anyString())).thenReturn(List.of(Map.of("id",9L,"recipient","previous@example.test","title","Account email changed","body","Changed to new@example.test","attempts",1)),List.of());
  new AccountMessageWorker(jdbc,mail).deliver();verify(mail).sendMessage("previous@example.test","Account email changed","Changed to new@example.test");verify(jdbc).update(contains("status='sent'"),eq(9L));
 }
 @Test void retriesTemporaryDeliveryErrorsWithoutExposingCredentials(){
  var jdbc=mock(JdbcTemplate.class);var mail=mock(NotificationSettingsService.class);when(mail.emailEnabled()).thenReturn(true);
  when(jdbc.queryForList(anyString())).thenReturn(List.of(Map.of("id",10L,"recipient","previous@example.test","title","Password changed","body","Your password changed","attempts",2)),List.of());doThrow(new IllegalStateException("Sensitive SMTP detail")).when(mail).sendMessage(anyString(),anyString(),anyString());
  new AccountMessageWorker(jdbc,mail).deliver();verify(jdbc).update(contains("last_error=?"),eq("pending"),eq("IllegalStateException"),eq(4),eq(10L));
 }
}
