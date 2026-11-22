package com.legaldesk;
import com.legaldesk.modules.users.domain.UserEntity;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import com.legaldesk.modules.settings.application.*;
import com.legaldesk.modules.notifications.application.NotificationSettingsService;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.jose4j.json.JsonUtil;
import org.jose4j.jwt.*;
import org.jose4j.jws.*;
import org.jose4j.keys.HmacKey;
import java.net.*;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.time.*;
@org.springframework.test.context.ActiveProfiles("test")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable(named="LEGALDESK_INTEGRATION_TESTS",matches="true")
class IdentityJwtConsultationIntegrationTest {
 private static final String SCHEMA="identity_jwt_test_"+UUID.randomUUID().toString().replace("-","");
 @DynamicPropertySource static void properties(DynamicPropertyRegistry r){r.add("spring.datasource.url",()->"jdbc:postgresql://localhost:5432/legaldesk?currentSchema="+SCHEMA);r.add("spring.datasource.username",()->"legaldesk");r.add("spring.datasource.password",()->"legaldesk");r.add("spring.flyway.schemas",()->SCHEMA);r.add("spring.flyway.default-schema",()->SCHEMA);r.add("app.settings-key-file",()->".data/tests/"+SCHEMA+"/settings.key");r.add("app.attachments-directory",()->".data/tests/"+SCHEMA+"/attachments");r.add("app.notifications.poll-ms",()->"3600000");}
 @org.springframework.beans.factory.annotation.Value("${local.server.port}") int port;
 @Autowired JdbcTemplate jdbc;@Autowired UserEntityRepository users;@Autowired PasswordEncoder encoder;@Autowired SettingsService settings;@Autowired SettingsCipher cipher;
 @MockitoBean NotificationSettingsService mail;
 private final HttpClient http=HttpClient.newHttpClient();private final AtomicLong sequence=new AtomicLong(90000000000000L);private String token;
 @BeforeEach void before()throws Exception{reset(mail);when(mail.emailEnabled()).thenReturn(true);settings.put("auth.session",Map.of("durationMinutes",60));settings.put("auth.verification",Map.of("codeMinutes",5,"accessMinutes",15,"maxAttempts",5,"resendSeconds",60));var admin=new UserEntity();admin.setName("Test admin");admin.setNationalId(Long.toString(sequence.incrementAndGet()));admin.setEmail("admin"+admin.getNationalId()+"@example.test");admin.setRole("admin");admin.setPasswordHash(encoder.encode("password123"));users.saveAndFlush(admin);var login=call("POST","/api/auth/login",Map.of("nationalId",admin.getNationalId(),"password","password123"),null);assertEquals(200,login.statusCode());token=(String)json(login).get("token");}
 @AfterAll void cleanup(){assertEquals(SCHEMA,jdbc.queryForObject("SELECT current_schema()",String.class));assertTrue(SCHEMA.matches("identity_jwt_test_[a-f0-9]{32}"));jdbc.execute("DROP SCHEMA "+SCHEMA+" CASCADE");}
 private HttpResponse<String> call(String method,String path,Object body,String bearer)throws Exception{var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path)).header("Content-Type","application/json");if(bearer!=null)builder.header("Authorization","Bearer "+bearer);builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(JsonUtil.toJson(body instanceof Map<?,?> map?(Map<String,Object>)map:Map.of())));return http.send(builder.build(),HttpResponse.BodyHandlers.ofString());}
 private Map<String,Object> json(HttpResponse<String> response)throws Exception{return JsonUtil.parseJson(response.body());}
 @Test void identityAndSignedCookieReplaceHttpSessions()throws Exception{
  assertEquals(3,token.split("\\.").length);assertEquals(200,call("GET","/api/auth/me",null,token).statusCode());assertEquals(401,call("GET","/api/dashboard/summary",null,null).statusCode());
  assertEquals(400,call("POST","/api/auth/login",Map.of("nationalId","123","password","password123"),null).statusCode());
  assertEquals(400,call("POST","/api/auth/login",Map.of("email","someone@example.test","password","password123"),null).statusCode());
  String forged=token.substring(0,token.lastIndexOf('.')+1)+"A".repeat(43);assertEquals(401,call("GET","/api/auth/me",null,forged).statusCode());
  assertEquals(200,call("POST","/api/auth/logout",Map.of(),token).statusCode());assertEquals(401,call("GET","/api/auth/me",null,token).statusCode());
 }
 @Test void expiryAndOfficeDurationAreEnforced()throws Exception{
  String identity=Long.toString(sequence.incrementAndGet());var admin=new UserEntity();admin.setName("Duration admin");admin.setNationalId(identity);admin.setPasswordHash(encoder.encode("password123"));admin.setRole("admin");users.saveAndFlush(admin);
  settings.put("auth.session",Map.of("durationMinutes",5));var login=call("POST","/api/auth/login",Map.of("nationalId",identity,"password","password123"),null);String issued=(String)json(login).get("token");var claims=new org.jose4j.jwt.consumer.JwtConsumerBuilder().setSkipSignatureVerification().setSkipAllValidators().build().processToClaims(issued);assertEquals(300,claims.getExpirationTime().getValue()-claims.getIssuedAt().getValue());
  String cookie=login.headers().firstValue("set-cookie").orElseThrow();assertTrue(cookie.contains("HttpOnly"));assertTrue(cookie.contains("SameSite=Strict"));assertFalse(cookie.contains("JSESSIONID"));
  JwtClaims expired=new JwtClaims();expired.setIssuer("legaldesk");expired.setAudience("legaldesk-web");expired.setSubject(admin.getId().toString());expired.setJwtId(UUID.randomUUID().toString());expired.setIssuedAt(NumericDate.fromSeconds(Instant.now().minusSeconds(600).getEpochSecond()));expired.setExpirationTime(NumericDate.fromSeconds(Instant.now().minusSeconds(300).getEpochSecond()));expired.setClaim("version",0);var jws=new JsonWebSignature();jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.HMAC_SHA256);jws.setKey(new HmacKey(Base64.getDecoder().decode(cipher.decrypt((String)settings.get("auth.signing").get("encryptedKey")))));jws.setPayload(expired.toJson());assertEquals(401,call("GET","/api/auth/me",null,jws.getCompactSerialization()).statusCode());
 }
 @Test void onboardingAcceptsPhoneOnlyAndRevokesOldTokenAfterPasswordChange()throws Exception{
  String identity=Long.toString(sequence.incrementAndGet());var created=call("POST","/api/users",Map.of("name","Phone lawyer","nationalId",identity,"phone","+201000000001","password","password123","role","lawyer"),token);assertEquals(201,created.statusCode());
  assertEquals(400,call("POST","/api/users",Map.of("name","Duplicate","nationalId",identity,"email","duplicate@example.test","password","password123","role","lawyer"),token).statusCode());
  var login=call("POST","/api/auth/login",Map.of("nationalId",identity,"password","password123"),null);String old=(String)json(login).get("token");assertEquals(403,call("GET","/api/users",null,old).statusCode());var changed=call("POST","/api/auth/change-password",Map.of("currentPassword","password123","newPassword","changedPass123"),old);assertEquals(200,changed.statusCode());String fresh=changed.headers().firstValue("set-cookie").orElseThrow().split(";",2)[0].split("=",2)[1];assertEquals(401,call("GET","/api/users",null,old).statusCode());assertEquals(200,call("GET","/api/users",null,fresh).statusCode());
 }
 @Test void accountCreationLinksBothContactTypesAndAllowsNoContact()throws Exception{
  String email="client"+sequence.incrementAndGet()+"@example.test",phone="+201"+Long.toString(sequence.incrementAndGet()).substring(5);
  var emailRequest=call("POST","/api/public/consultations",Map.of("name","Visitor","email",email.toUpperCase(),"summary","Legal question for office"),null);assertEquals(201,emailRequest.statusCode());long first=((Number)json(emailRequest).get("id")).longValue();
  var phoneRequest=call("POST","/api/public/consultations",Map.of("name","Visitor","phone",phone,"summary","Another legal question"),null);assertEquals(201,phoneRequest.statusCode());long second=((Number)json(phoneRequest).get("id")).longValue();
  var client=call("POST","/api/clients",Map.of("name","Client","email",email,"phone",phone),token);assertEquals(201,client.statusCode());long id=((Number)json(client).get("id")).longValue();String identity=Long.toString(sequence.incrementAndGet());assertEquals(200,call("POST","/api/office-portal/clients/"+id+"/account",Map.of("nationalId",identity,"email",email,"phone",phone,"password","password123"),token).statusCode());assertEquals(id,jdbc.queryForObject("SELECT client_id FROM consultation_requests WHERE id=?",Long.class,first));assertEquals(id,jdbc.queryForObject("SELECT client_id FROM consultation_requests WHERE id=?",Long.class,second));
  var noContact=call("POST","/api/clients",Map.of("name","No contact"),token);long other=((Number)json(noContact).get("id")).longValue();assertEquals(200,call("POST","/api/office-portal/clients/"+other+"/account",Map.of("nationalId",Long.toString(sequence.incrementAndGet()),"password","password123"),token).statusCode());
 }
 @Test void clientLogsInByIdentityAndSplitPhoneLinksConsultation()throws Exception{
  String phone="+20 01000000000",identity=Long.toString(sequence.incrementAndGet()),email="identityclient"+identity+"@example.test";
  var request=call("POST","/api/public/consultations",Map.of("name","Visitor","phone",phone,"summary","Question with split phone number"),null);assertEquals(201,request.statusCode());long requestId=((Number)json(request).get("id")).longValue();
  var client=call("POST","/api/clients",Map.of("name","Identity client","phone","+201000000000"),token);assertEquals(201,client.statusCode());long clientId=((Number)json(client).get("id")).longValue();
  assertEquals(200,call("POST","/api/office-portal/clients/"+clientId+"/account",Map.of("nationalId",identity,"email",email,"phone","+201000000000","password","password123"),token).statusCode());
  assertEquals(clientId,jdbc.queryForObject("SELECT client_id FROM consultation_requests WHERE id=?",Long.class,requestId));
  assertEquals(400,call("POST","/api/auth/login",Map.of("email",email,"password","password123"),null).statusCode());
  var login=call("POST","/api/auth/login",Map.of("nationalId",identity,"password","password123"),null);assertEquals(200,login.statusCode());assertTrue(login.body().contains("client"));
 }
 @Test void otpIsSingleUseAndScopesTrackingToVerifiedContact()throws Exception{
  String contact="visitor"+sequence.incrementAndGet()+"@example.test";var submit=call("POST","/api/public/consultations",Map.of("name","Visitor","email",contact,"summary","Question to verify securely"),null);long id=((Number)json(submit).get("id")).longValue();
  var request=call("POST","/api/public/consultations/verification/request",Map.of("contact",contact),null);assertEquals(200,request.statusCode());String challenge=json(request).get("challengeId").toString();var body=org.mockito.ArgumentCaptor.forClass(String.class);verify(mail).sendMessage(eq(contact),anyString(),body.capture());String code=java.util.regex.Pattern.compile("[0-9]{6}").matcher(body.getValue()).results().findFirst().orElseThrow().group();
  var verified=call("POST","/api/public/consultations/verification/verify",Map.of("challengeId",challenge,"code",code),null);assertEquals(200,verified.statusCode());String access=(String)json(verified).get("accessToken");assertEquals(401,call("POST","/api/public/consultations/verification/verify",Map.of("challengeId",challenge,"code",code),null).statusCode());
  var tracked=call("POST","/api/public/consultations/track",Map.of("accessToken",access),null);assertEquals(200,tracked.statusCode());assertTrue(tracked.body().contains("Question to verify securely"));assertEquals(401,call("POST","/api/public/consultations/track",Map.of("accessToken","invalid"),null).statusCode());
  var other=call("POST","/api/public/consultations",Map.of("name","Other","email","other"+sequence.incrementAndGet()+"@example.test","summary","Unrelated confidential question"),null);long otherId=((Number)json(other).get("id")).longValue();assertEquals(404,call("POST","/api/public/consultations/reply",Map.of("id",otherId,"accessToken",access,"response","Should fail"),null).statusCode());
  assertEquals(200,call("POST","/api/consultation-requests/"+id+"/reply",Map.of("response","Office response"),token).statusCode());assertEquals(200,call("POST","/api/public/consultations/reply",Map.of("id",id,"accessToken",access,"response","Visitor follow-up"),null).statusCode());assertEquals(400,call("POST","/api/public/consultations/reply",Map.of("id",id,"accessToken",access,"response","Second reply"),null).statusCode());
 }
 @Test void failedOtpAttemptsCommitAndLockOut()throws Exception{
  String contact="locked"+sequence.incrementAndGet()+"@example.test";var request=call("POST","/api/public/consultations/verification/request",Map.of("contact",contact),null);UUID challenge=UUID.fromString(json(request).get("challengeId").toString());var body=org.mockito.ArgumentCaptor.forClass(String.class);verify(mail).sendMessage(eq(contact),anyString(),body.capture());String code=java.util.regex.Pattern.compile("[0-9]{6}").matcher(body.getValue()).results().findFirst().orElseThrow().group();String wrong=code.equals("000000")?"111111":"000000";for(int i=0;i<5;i++)assertEquals(401,call("POST","/api/public/consultations/verification/verify",Map.of("challengeId",challenge,"code",wrong),null).statusCode());assertEquals(5,jdbc.queryForObject("SELECT attempts FROM consultation_verifications WHERE id=?",Integer.class,challenge));assertEquals(401,call("POST","/api/public/consultations/verification/verify",Map.of("challengeId",challenge,"code",code),null).statusCode());
 }
 @Test void settingsAreCentralizedAndStaffCannotChangeSessionPolicy()throws Exception{
  assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=? AND table_name IN ('office_email_settings','office_bank_details','notification_vapid')",Integer.class,SCHEMA));assertTrue(settings.get("office.email").containsKey("password_encrypted"));
  assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=? AND table_name='notification_preferences'",Integer.class,SCHEMA));
  assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM settings WHERE name LIKE 'notifications.user.%'",Integer.class));
  var invalid=call("PUT","/api/settings/office/session",Map.of("durationMinutes",0,"codeMinutes",5,"accessMinutes",15,"maxAttempts",5,"resendSeconds",60),token);assertEquals(400,invalid.statusCode());
 }
 @Test void assignedLawyersAloneSeeAndReplyToVisitorRequests()throws Exception{
  List<Long> ids=new ArrayList<>();List<String> tokens=new ArrayList<>();for(int i=0;i<2;i++){var lawyer=new UserEntity();lawyer.setName("Assigned lawyer "+i);lawyer.setNationalId(Long.toString(sequence.incrementAndGet()));lawyer.setRole("lawyer");lawyer.setPasswordHash(encoder.encode("password123"));users.saveAndFlush(lawyer);ids.add(lawyer.getId());tokens.add((String)json(call("POST","/api/auth/login",Map.of("nationalId",lawyer.getNationalId(),"password","password123"),null)).get("token"));}
  String summary="Assigned request "+UUID.randomUUID();long id=((Number)json(call("POST","/api/public/consultations",Map.of("name","Assigned visitor","email","assigned"+sequence.incrementAndGet()+"@example.test","summary",summary),null)).get("id")).longValue();assertFalse(call("GET","/api/consultation-requests",null,tokens.getFirst()).body().contains(summary));assertEquals(200,call("PATCH","/api/consultation-requests/"+id+"/assign",Map.of("assigneeIds",ids),token).statusCode());for(String t:tokens)assertTrue(call("GET","/api/consultation-requests",null,t).body().contains(summary));assertEquals(200,call("PATCH","/api/consultation-requests/"+id+"/assign",Map.of("assigneeIds",List.of(ids.getFirst())),token).statusCode());assertFalse(call("GET","/api/consultation-requests",null,tokens.getLast()).body().contains(summary));assertEquals(404,call("POST","/api/consultation-requests/"+id+"/reply",Map.of("response","Unassigned"),tokens.getLast()).statusCode());assertEquals(403,call("GET","/api/settings/office",null,tokens.getFirst()).statusCode());
 }
 @Test void expiredCodesResendLimitsAndUnconfiguredPhoneCannotExposeConsultations()throws Exception{
  String contact="expired"+sequence.incrementAndGet()+"@example.test";var requested=call("POST","/api/public/consultations/verification/request",Map.of("contact",contact),null);UUID challenge=UUID.fromString(json(requested).get("challengeId").toString());assertEquals(400,call("POST","/api/public/consultations/verification/request",Map.of("contact",contact),null).statusCode());var body=org.mockito.ArgumentCaptor.forClass(String.class);verify(mail).sendMessage(eq(contact),anyString(),body.capture());String code=java.util.regex.Pattern.compile("[0-9]{6}").matcher(body.getValue()).results().findFirst().orElseThrow().group();jdbc.update("UPDATE consultation_verifications SET expires_at=NOW()-INTERVAL '1 minute' WHERE id=?",challenge);assertEquals(401,call("POST","/api/public/consultations/verification/verify",Map.of("challengeId",challenge,"code",code),null).statusCode());assertEquals(400,call("POST","/api/public/consultations/verification/request",Map.of("contact","+201000000002"),null).statusCode());
 }
 @Test void browserOriginChecksAndAccountDeactivationRejectAccess()throws Exception{
  var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/auth/logout")).header("Origin","https://unrelated.example").header("Authorization","Bearer "+token).POST(HttpRequest.BodyPublishers.ofString("{}"));assertEquals(403,http.send(builder.build(),HttpResponse.BodyHandlers.ofString()).statusCode());var user=users.findById(Long.parseLong(new org.jose4j.jwt.consumer.JwtConsumerBuilder().setSkipSignatureVerification().setSkipAllValidators().build().processToClaims(token).getSubject())).orElseThrow();user.setActive(false);users.saveAndFlush(user);assertEquals(401,call("GET","/api/auth/me",null,token).statusCode());assertEquals(401,call("POST","/api/auth/login",Map.of("nationalId",user.getNationalId(),"password","password123"),null).statusCode());
 }


 private String userToken(String role,String name)throws Exception{var u=new UserEntity();u.setName(name);u.setNationalId(Long.toString(sequence.incrementAndGet()));u.setRole(role);u.setPasswordHash(encoder.encode("password123"));users.saveAndFlush(u);return (String)json(call("POST","/api/auth/login",Map.of("nationalId",u.getNationalId(),"password","password123"),null)).get("token");}
 private long tokenUser(String t)throws Exception{return Long.parseLong(new org.jose4j.jwt.consumer.JwtConsumerBuilder().setSkipSignatureVerification().setSkipAllValidators().build().processToClaims(t).getSubject());}
 private HttpResponse<String> complete(long c,long r,String bearer,boolean withFile)throws Exception{
  String boundary="LegalDeskTestBoundary";
  String multipart="--"+boundary+"\r\nContent-Disposition: form-data; name=\"notes\"\r\n\r\nتم تقديم المستند المطلوب\r\n";
  if(withFile)multipart+="--"+boundary+"\r\nContent-Disposition: form-data; name=\"files\"; filename=\"evidence.txt\"\r\nContent-Type: text/plain\r\n\r\nevidence content\r\n";
  multipart+="--"+boundary+"--\r\n";
  return http.send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/client-portal/cases/"+c+"/requests/"+r+"/complete")).header("Authorization","Bearer "+bearer).header("Content-Type","multipart/form-data; boundary="+boundary).POST(HttpRequest.BodyPublishers.ofString(multipart)).build(),HttpResponse.BodyHandlers.ofString());
 }
 @Test void hearingReportsRequestsAndCompletionAreScopedAndAudited()throws Exception{
  String clientToken=userToken("client","Responsible client"),otherToken=userToken("client","Other client"),lawyerToken=userToken("lawyer","Unassigned lawyer");
  long client=jdbc.queryForObject("INSERT INTO clients(name,user_id) VALUES('Responsible client',?) RETURNING id",Long.class,tokenUser(clientToken));
  long other=jdbc.queryForObject("INSERT INTO clients(name,user_id) VALUES('Other client',?) RETURNING id",Long.class,tokenUser(otherToken));
  long c=jdbc.queryForObject("INSERT INTO cases(case_number,client_id,type,status) VALUES(?,?,'civil','active') RETURNING id",Long.class,"HEARING-"+UUID.randomUUID(),client);
  jdbc.update("INSERT INTO case_clients(case_id,client_id) VALUES(?,?)",c,other);
  assertEquals(200,call("POST","/api/office-portal/cases/"+c+"/hearings",Map.of("datetime","2026-10-10T09:00:00Z","court","محكمة الاختبار","type","جلسة مرافعة"),token).statusCode());
  long hearing=jdbc.queryForObject("SELECT id FROM hearings WHERE case_id=?",Long.class,c);
  assertEquals(1,jdbc.queryForObject("SELECT hearing_number FROM hearings WHERE id=?",Integer.class,hearing));
  assertEquals(200,call("POST","/api/office-portal/cases/"+c+"/hearings",Map.of("datetime","2026-11-10T09:00:00Z","court","محكمة الاختبار","type","تقديم مستندات"),token).statusCode());
  long target=jdbc.queryForObject("SELECT id FROM hearings WHERE case_id=? AND hearing_number=2",Long.class,c);
  var body=Map.of("body","تم تقديم المرافعة وطلب القاضي أصل المستند.","requests",List.of(Map.of("clientId",client,"title","أصل العقد","details","ارفع أصل العقد للتقديم إلى المحكمة","kind","document","targetHearingId",target,"dueAt","2026-11-09T09:00:00Z")));
  assertEquals(404,call("POST","/api/office-portal/cases/"+c+"/hearings/"+hearing+"/reports",body,lawyerToken).statusCode());
  var saved=call("POST","/api/office-portal/cases/"+c+"/hearings/"+hearing+"/reports",body,token);assertEquals(200,saved.statusCode(),saved.body());
  long request=jdbc.queryForObject("SELECT id FROM case_client_requests WHERE case_id=?",Long.class,c);
  assertTrue(call("GET","/api/client-portal/cases/"+c,null,clientToken).body().contains("أصل العقد"));
  assertFalse(call("GET","/api/client-portal/cases/"+c,null,otherToken).body().contains("أصل العقد"));
  assertEquals(404,complete(c,request,otherToken,true).statusCode());
  assertEquals(400,complete(c,request,clientToken,false).statusCode());
  var completed=complete(c,request,clientToken,true);assertEquals(200,completed.statusCode(),completed.body());
  assertEquals("completed",jdbc.queryForObject("SELECT status FROM case_client_requests WHERE id=?",String.class,request));
  assertNotNull(jdbc.queryForObject("SELECT completed_at FROM case_client_requests WHERE id=?",OffsetDateTime.class,request));
  assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM documents WHERE client_request_id=? AND storage_key IS NOT NULL AND content IS NULL",Integer.class,request));
  assertEquals(400,complete(c,request,clientToken,true).statusCode());
  var activity=call("GET","/api/cases/"+c+"/activity",null,token);assertEquals(200,activity.statusCode());assertTrue(activity.body().contains("hearing_number"));assertTrue(activity.body().contains("Responsible client"));assertTrue(activity.body().contains("completion_notes"));
  assertTrue(call("GET","/api/client-portal/cases/"+c,null,clientToken).body().contains("تم تقديم المستند المطلوب"));
 }

 @Test void recoveryLinkIsSingleUseExpiresAndRevokesOldSessions()throws Exception{
  String email="recovery"+sequence.incrementAndGet()+"@example.test",identity=Long.toString(sequence.incrementAndGet());var u=new UserEntity();u.setName("Recovery user");u.setNationalId(identity);u.setEmail(email);u.setRole("client");u.setPasswordHash(encoder.encode("password123"));users.saveAndFlush(u);
  String old=(String)json(call("POST","/api/auth/login",Map.of("nationalId",identity,"password","password123"),null)).get("token");
  assertEquals(200,call("POST","/api/auth/forgot-password",Map.of("nationalId",identity),null).statusCode());
  var body=org.mockito.ArgumentCaptor.forClass(String.class);verify(mail,timeout(3000)).sendMessage(eq(email),anyString(),body.capture());
  String reset=java.util.regex.Pattern.compile("#token=([A-Za-z0-9_-]{43})").matcher(body.getValue()).results().findFirst().orElseThrow().group(1);
  assertFalse(jdbc.queryForObject("SELECT token_hash FROM password_reset_tokens WHERE user_id=?",String.class,u.getId()).equals(reset));
  assertEquals(400,call("POST","/api/auth/reset-password",Map.of("token",reset,"newPassword","short"),null).statusCode());
  assertEquals(200,call("POST","/api/auth/reset-password",Map.of("token",reset,"newPassword","newPassword123"),null).statusCode());
  assertEquals(401,call("GET","/api/auth/me",null,old).statusCode());assertEquals(401,call("POST","/api/auth/login",Map.of("nationalId",identity,"password","password123"),null).statusCode());
  assertEquals(200,call("POST","/api/auth/login",Map.of("nationalId",identity,"password","newPassword123"),null).statusCode());
  assertEquals(400,call("POST","/api/auth/reset-password",Map.of("token",reset,"newPassword","anotherPassword123"),null).statusCode());
  reset(mail);when(mail.emailEnabled()).thenReturn(true);assertEquals(200,call("POST","/api/auth/forgot-password",Map.of("nationalId",identity),null).statusCode());body=org.mockito.ArgumentCaptor.forClass(String.class);verify(mail,timeout(3000)).sendMessage(eq(email),anyString(),body.capture());String expired=java.util.regex.Pattern.compile("#token=([A-Za-z0-9_-]{43})").matcher(body.getValue()).results().findFirst().orElseThrow().group(1);
  jdbc.update("UPDATE password_reset_tokens SET expires_at=NOW()-INTERVAL '1 minute' WHERE user_id=?",u.getId());assertEquals(400,call("POST","/api/auth/reset-password",Map.of("token",expired,"newPassword","anotherPassword123"),null).statusCode());
 }
 @Test void recoveryDoesNotRevealUnknownOrPhoneOnlyAccounts()throws Exception{
  var u=new UserEntity();u.setName("Phone only recovery");u.setNationalId(Long.toString(sequence.incrementAndGet()));u.setPhone("+201000000008");u.setRole("lawyer");u.setPasswordHash(encoder.encode("password123"));users.saveAndFlush(u);
  var unknown=call("POST","/api/auth/forgot-password",Map.of("nationalId",Long.toString(sequence.incrementAndGet())),null);
  var phone=call("POST","/api/auth/forgot-password",Map.of("nationalId",u.getNationalId()),null);assertEquals(200,unknown.statusCode());assertEquals(unknown.body(),phone.body());verify(mail,never()).sendMessage(anyString(),anyString(),anyString());
 }

 @Test void allRolesManageOnlyTheirOwnContactAndReceiveSecurityMessages()throws Exception{
  for(String role:List.of("client","lawyer","admin","owner")){
   String bearer=userToken(role,"Profile "+role);long id=tokenUser(bearer);String old="old"+id+"@example.test",next="new"+id+"@example.test";
   jdbc.update("UPDATE users SET email=?,phone='+201000000010' WHERE id=?",old,id);
   var profile=call("GET","/api/account",null,bearer);assertEquals(200,profile.statusCode());String identity=(String)json(profile).get("nationalId");
   assertEquals(400,call("PATCH","/api/account",Map.of("email",next,"phone","+966500000000","currentPassword","wrong"),bearer).statusCode());
   var result=call("PATCH","/api/account",Map.of("email",next,"phone","+966500000000","currentPassword","password123","name","Changed name","nationalId","11111111111111","role","owner"),bearer);
   assertEquals(200,result.statusCode(),result.body());assertEquals("Profile "+role,json(result).get("name"));assertEquals(identity,json(result).get("nationalId"));assertEquals(next,json(result).get("email"));assertEquals(role,json(result).get("role"));
   assertEquals(4,jdbc.queryForObject("SELECT count(*) FROM account_messages WHERE user_id=?",Integer.class,id));assertEquals(2,jdbc.queryForObject("SELECT count(*) FROM account_messages WHERE user_id=? AND recipient=?",Integer.class,id,old));
   assertEquals(2,jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id=? AND type='account'",Integer.class,id));
   assertTrue(jdbc.queryForList("SELECT body FROM account_messages WHERE user_id=?",String.class,id).stream().allMatch(v->!v.contains("password123")));
   if(Set.of("admin","owner").contains(role))assertEquals(400,call("PATCH","/api/users/"+id,Map.of("nationalId","11111111111111"),bearer).statusCode());
   var changed=call("POST","/api/auth/change-password",Map.of("currentPassword","password123","newPassword","newPassword123"),bearer);assertEquals(200,changed.statusCode(),changed.body());
   assertEquals(401,call("GET","/api/account",null,bearer).statusCode());assertEquals(5,jdbc.queryForObject("SELECT count(*) FROM account_messages WHERE user_id=?",Integer.class,id));
  }
  assertEquals(401,call("GET","/api/account",null,null).statusCode());
 }
 private HttpResponse<String> uploadAvatar(String bearer,byte[] bytes,String type)throws Exception{
  String boundary="AvatarTestBoundary";var data=new java.io.ByteArrayOutputStream();data.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"avatar.png\"\r\nContent-Type: "+type+"\r\n\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));data.write(bytes);data.write(("\r\n--"+boundary+"--\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
  return http.send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/account/avatar")).header("Authorization","Bearer "+bearer).header("Content-Type","multipart/form-data; boundary="+boundary).POST(HttpRequest.BodyPublishers.ofByteArray(data.toByteArray())).build(),HttpResponse.BodyHandlers.ofString());
 }
 @Test void profilePicturesAreValidatedStoredOnDiskAndPrivate()throws Exception{
  String bearer=userToken("client","Avatar client"),other=userToken("lawyer","Other avatar user");long id=tokenUser(bearer);
  assertEquals(400,uploadAvatar(bearer,"<svg onload='alert(1)'></svg>".getBytes(),"image/png").statusCode());
  var image=new java.awt.image.BufferedImage(800,600,java.awt.image.BufferedImage.TYPE_INT_RGB);var bytes=new java.io.ByteArrayOutputStream();javax.imageio.ImageIO.write(image,"png",bytes);
  var uploaded=uploadAvatar(bearer,bytes.toByteArray(),"image/png");assertEquals(200,uploaded.statusCode(),uploaded.body());assertTrue(json(uploaded).get("avatarUrl").toString().startsWith("/api/account/avatar?v="));
  assertTrue(jdbc.queryForObject("SELECT avatar_key FROM user_profiles WHERE user_id=?",String.class,id).startsWith("Profiles/user_"+id+"/avatar_"));
  var downloaded=http.send(HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/account/avatar")).header("Authorization","Bearer "+bearer).GET().build(),HttpResponse.BodyHandlers.ofByteArray());assertEquals(200,downloaded.statusCode());var resized=javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(downloaded.body()));assertEquals(512,resized.getWidth());
  assertEquals(404,call("GET","/api/account/avatar",null,other).statusCode());assertEquals(401,call("GET","/api/account/avatar",null,null).statusCode());
  assertEquals(200,uploadAvatar(bearer,bytes.toByteArray(),"image/png").statusCode());assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM attachment_cleanup WHERE storage_key LIKE ?",Integer.class,"Profiles/user_"+id+"/%"));
 }

 @Test void lawyerDeletionIsBlockedUntilCasesAreTransferredAndHistoryIsPreserved()throws Exception{
  String sourceToken=userToken("lawyer","Transfer source"),targetToken=userToken("lawyer","Transfer target"),otherToken=userToken("lawyer","Other case lawyer");long source=tokenUser(sourceToken),target=tokenUser(targetToken),other=tokenUser(otherToken);
  jdbc.update("UPDATE users SET email=?,address='عنوان المحامي' WHERE id=?","source"+source+"@example.test",source);jdbc.update("UPDATE users SET email=? WHERE id=?","target"+target+"@example.test",target);
  long client=jdbc.queryForObject("INSERT INTO clients(name) VALUES('Transfer client') RETURNING id",Long.class);
  var created=call("POST","/api/cases",Map.of("caseNumber","TRANSFER-"+UUID.randomUUID(),"title","قضية عقد تجاري","type","commercial","clientIds",List.of(client),"lawyerIds",List.of(source,other)),token);assertEquals(201,created.statusCode(),created.body());long c=((Number)json(created).get("id")).longValue();
  var details=call("GET","/api/lawyers/"+source,null,token);assertEquals(200,details.statusCode());assertTrue(details.body().contains("قضية عقد تجاري"));assertTrue(details.body().contains("Other case lawyer"));assertTrue(details.body().contains("عنوان المحامي"));
  var blocked=call("DELETE","/api/users/"+source,null,token);assertEquals(400,blocked.statusCode(),blocked.body());assertTrue(blocked.body().contains("Transfer source"));
  assertEquals(403,call("POST","/api/lawyers/"+source+"/cases/"+c+"/reassign",Map.of("lawyerId",target),otherToken).statusCode());
  var moved=call("POST","/api/lawyers/"+source+"/cases/"+c+"/reassign",Map.of("lawyerId",target),token);assertEquals(200,moved.statusCode(),moved.body());
  assertEquals(target,jdbc.queryForObject("SELECT lead_lawyer_id FROM cases WHERE id=?",Long.class,c));assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM case_lawyers WHERE case_id=? AND user_id=?",Integer.class,c,source));assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM case_lawyers WHERE case_id=? AND user_id=?",Integer.class,c,other));assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM case_lawyers WHERE case_id=? AND user_id=?",Integer.class,c,target));
  assertEquals(404,call("GET","/api/office-portal/cases/"+c,null,sourceToken).statusCode());assertEquals(200,call("GET","/api/office-portal/cases/"+c,null,targetToken).statusCode());
  assertTrue(jdbc.queryForObject("SELECT body FROM account_messages WHERE user_id=? ORDER BY id DESC LIMIT 1",String.class,target).contains("/case-workspace/"+c));assertTrue(jdbc.queryForObject("SELECT body FROM account_messages WHERE user_id=? ORDER BY id DESC LIMIT 1",String.class,source).contains("تم رفعك"));
  assertEquals(204,call("DELETE","/api/users/"+source,null,token).statusCode());assertEquals(false,jdbc.queryForObject("SELECT active FROM users WHERE id=?",Boolean.class,source));assertFalse(call("GET","/api/users",null,token).body().contains("Transfer source"));assertEquals(401,call("GET","/api/auth/me",null,sourceToken).statusCode());
  assertTrue(jdbc.queryForObject("SELECT count(*) FROM case_activity WHERE case_id=?",Long.class,c)>0);
 }
 @Test void unassignmentAndExistingReplacementPreserveOtherLawyers()throws Exception{
  String sourceToken=userToken("lawyer","Unassign source"),targetToken=userToken("lawyer","Already assigned");long source=tokenUser(sourceToken),target=tokenUser(targetToken);long client=jdbc.queryForObject("INSERT INTO clients(name) VALUES('Unassign client') RETURNING id",Long.class);
  long first=jdbc.queryForObject("INSERT INTO cases(case_number,type,client_id,lead_lawyer_id) VALUES('UNASSIGN','civil',?,?) RETURNING id",Long.class,client,source);
  assertEquals(200,call("POST","/api/lawyers/"+source+"/cases/"+first+"/reassign",new LinkedHashMap<String,Object>(){{put("lawyerId",null);}},token).statusCode());assertNull(jdbc.queryForObject("SELECT lead_lawyer_id FROM cases WHERE id=?",Long.class,first));assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM case_lawyers WHERE case_id=?",Integer.class,first));
  long second=jdbc.queryForObject("INSERT INTO cases(case_number,type,client_id,lead_lawyer_id) VALUES('REUSE','civil',?,?) RETURNING id",Long.class,client,source);jdbc.update("INSERT INTO case_lawyers(case_id,user_id) VALUES(?,?)",second,target);
  assertEquals(200,call("POST","/api/lawyers/"+source+"/cases/"+second+"/reassign",Map.of("lawyerId",target),token).statusCode());assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM case_lawyers WHERE case_id=?",Integer.class,second));
  long third=jdbc.queryForObject("INSERT INTO cases(case_number,type,client_id,lead_lawyer_id) VALUES('INVALID-TARGET','civil',?,?) RETURNING id",Long.class,client,source);jdbc.update("UPDATE users SET active=FALSE WHERE id=?",target);
  assertEquals(400,call("POST","/api/lawyers/"+source+"/cases/"+third+"/reassign",Map.of("lawyerId",target),token).statusCode());assertEquals(source,jdbc.queryForObject("SELECT lead_lawyer_id FROM cases WHERE id=?",Long.class,third));
 }
}
