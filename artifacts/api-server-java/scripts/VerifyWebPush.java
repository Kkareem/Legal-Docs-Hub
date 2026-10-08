import java.security.*;
import java.security.spec.ECGenParameterSpec;
import java.util.*;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.interfaces.*;
import nl.martijndwars.webpush.*;

// Exercises real VAPID signing and AES128GCM encryption locally; performs no HTTP requests.
class VerifyWebPush {
 public static void main(String[] args)throws Exception{
  Security.addProvider(new BouncyCastleProvider());
  var generator=KeyPairGenerator.getInstance("EC","BC");generator.initialize(new ECGenParameterSpec("secp256r1"));
  var sender=generator.generateKeyPair();var browser=generator.generateKeyPair();var encoder=Base64.getUrlEncoder().withoutPadding();
  String publicKey=encoder.encodeToString(((ECPublicKey)sender.getPublic()).getQ().getEncoded(false));
  byte[] raw=((ECPrivateKey)sender.getPrivate()).getD().toByteArray();byte[] fixed=new byte[32];
  System.arraycopy(raw,Math.max(0,raw.length-32),fixed,Math.max(0,32-raw.length),Math.min(32,raw.length));
  var service=new PushService(publicKey,encoder.encodeToString(fixed),"mailto:fixture@example.com");
  String browserKey=encoder.encodeToString(((ECPublicKey)browser.getPublic()).getQ().getEncoded(false));
  byte[] auth=new byte[16];new SecureRandom().nextBytes(auth);
  var message=new Notification("https://fcm.googleapis.com/wp/local-fixture",browserKey,encoder.encodeToString(auth),"generic update");
  var prepared=service.preparePost(message,Encoding.AES128GCM);
  if(!"aes128gcm".equals(prepared.getFirstHeader("Content-Encoding").getValue()))throw new AssertionError("Wrong encoding");
  if(!prepared.getFirstHeader("Authorization").getValue().startsWith("vapid "))throw new AssertionError("Missing signature");
  if(prepared.getEntity().getContentLength()<=14)throw new AssertionError("Missing encrypted payload");
  System.out.println("PASS: Web Push VAPID signing, subscription key parsing and AES128GCM payload encryption");
 }
}
