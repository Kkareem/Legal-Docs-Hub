package com.legaldesk;
import com.legaldesk.shared.security.ContactDetails;
import com.legaldesk.common.domain.BusinessRuleViolationException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class ContactDetailsTest {
 @Test void normalizesSplitNumbersForMatchingAndSms(){
  assertEquals("+201018681448",ContactDetails.phone("+20 01018681448"));
  assertEquals("+201018681448",ContactDetails.phone("+2 01018681448"));
  assertEquals("+966551400324",ContactDetails.phone("+966 0551400324"));
  assertEquals("+966551400324",ContactDetails.phone("00966 551400324"));
  assertEquals("+390612345678",ContactDetails.phone("+39 0612345678"));
  assertNull(ContactDetails.phone(""));
  assertThrows(BusinessRuleViolationException.class,()->ContactDetails.phone("+20 invalid"));
 }
}
