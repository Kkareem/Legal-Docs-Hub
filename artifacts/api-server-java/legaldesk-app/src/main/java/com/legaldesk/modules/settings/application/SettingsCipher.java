package com.legaldesk.modules.settings.application;
import java.nio.file.*;
import java.security.SecureRandom;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
@Component
public class SettingsCipher {
 private final byte[] key;
 public SettingsCipher(@Value("${app.settings-key-file:.data/settings.key}")String keyFile)throws Exception{
  Path path=Path.of(keyFile).toAbsolutePath();Files.createDirectories(path.getParent());byte[] generated=new byte[32];new SecureRandom().nextBytes(generated);
  try{Files.writeString(path,Base64.getEncoder().encodeToString(generated),StandardOpenOption.CREATE_NEW);}catch(FileAlreadyExistsException ignored){}
  key=Base64.getDecoder().decode(Files.readString(path).trim());if(key.length!=32)throw new IllegalArgumentException("Settings encryption key must contain 32 bytes");
 }
 public String encrypt(String plain){try{byte[] iv=new byte[12];new SecureRandom().nextBytes(iv);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,iv));byte[] data=c.doFinal(plain.getBytes(StandardCharsets.UTF_8));byte[] packed=Arrays.copyOf(iv,iv.length+data.length);System.arraycopy(data,0,packed,iv.length,data.length);return Base64.getEncoder().encodeToString(packed);}catch(Exception e){throw new IllegalStateException("Cannot encrypt settings",e);}}
 public String decrypt(String encrypted){try{byte[] packed=Base64.getDecoder().decode(encrypted);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,Arrays.copyOf(packed,12)));return new String(c.doFinal(Arrays.copyOfRange(packed,12,packed.length)),StandardCharsets.UTF_8);}catch(Exception e){throw new IllegalStateException("Cannot decrypt settings",e);}}
}
