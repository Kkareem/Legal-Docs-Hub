package com.legaldesk;
import com.legaldesk.shared.security.ContactDetails;
import com.legaldesk.common.domain.BusinessRuleViolationException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class ContactDetailsTest {
 @Test void normalizesSplitNumbersForMatchingAndSms(){
  assertEquals("+201000000000",ContactDetails.phone("+20 01000000000"));
  assertEquals("+201000000000",ContactDetails.phone("+2 01000000000"));
  assertEquals("+966500000000",ContactDetails.phone("+966 0500000000"));
  assertEquals("+966500000000",ContactDetails.phone("00966 500000000"));
  assertEquals("+390612345678",ContactDetails.phone("+39 0612345678"));
  assertNull(ContactDetails.phone(""));
  assertThrows(BusinessRuleViolationException.class,()->ContactDetails.phone("+20 invalid"));
 }
}
