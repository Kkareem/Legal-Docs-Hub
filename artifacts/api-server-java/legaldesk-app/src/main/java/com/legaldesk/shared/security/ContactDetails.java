package com.legaldesk.shared.security;
import com.legaldesk.common.domain.BusinessRuleViolationException;
import java.util.Locale;
public final class ContactDetails {
 private ContactDetails(){}
 public static String email(String value){if(value==null||value.isBlank())return null;value=value.trim().toLowerCase(Locale.ROOT);if(value.length()>254||!value.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))throw new BusinessRuleViolationException("Invalid email");return value;}
 public static String phone(String value){if(value==null||value.isBlank())return null;value=value.trim().replaceAll("[ ()-]","");if(value.startsWith("00"))value="+"+value.substring(2);if(value.startsWith("+200"))value="+20"+value.substring(4);if(value.startsWith("+9660"))value="+966"+value.substring(5);if(!value.matches("\\+?[0-9]{7,15}"))throw new BusinessRuleViolationException("Invalid phone");return value;}
 public static String identity(String value){if(value==null||!value.matches("[0-9]{14}"))throw new BusinessRuleViolationException("Identity number must contain exactly 14 digits");return value;}
 public static void requireContact(String email,String phone){if(email==null&&phone==null)throw new BusinessRuleViolationException("Email or phone is required");}
 public static String lookup(String contact){if(contact==null||contact.isBlank())throw new BusinessRuleViolationException("Email or phone is required");return contact.contains("@")?email(contact):phone(contact);}
}
