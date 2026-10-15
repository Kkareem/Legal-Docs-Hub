package com.legaldesk.shared.security;
import com.legaldesk.modules.settings.application.*;
import com.legaldesk.modules.users.domain.UserEntity;
import java.util.*;
import java.security.SecureRandom;
import java.time.*;
import org.jose4j.jwt.*;
import org.jose4j.jwt.consumer.*;
import org.jose4j.jws.*;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.keys.HmacKey;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
@Service
public class JwtService {
 private final SettingsService settings;private final JdbcTemplate jdbc;private final HmacKey key;
 public record Issued(String token,Instant expiresAt){}
 public JwtService(SettingsService settings,SettingsCipher cipher,JdbcTemplate jdbc){this.settings=settings;this.jdbc=jdbc;byte[] random=new byte[32];new SecureRandom().nextBytes(random);settings.initialize("auth.signing",Map.of("encryptedKey",cipher.encrypt(Base64.getEncoder().encodeToString(random))));this.key=new HmacKey(Base64.getDecoder().decode(cipher.decrypt((String)settings.get("auth.signing").get("encryptedKey"))));}
 public Issued issue(UserEntity user){try{Instant now=Instant.now();Instant end=now.plusSeconds(settings.sessionMinutes()*60L);JwtClaims claims=new JwtClaims();claims.setIssuer("legaldesk");claims.setAudience("legaldesk-web");claims.setSubject(user.getId().toString());claims.setIssuedAt(NumericDate.fromSeconds(now.getEpochSecond()));claims.setExpirationTime(NumericDate.fromSeconds(end.getEpochSecond()));claims.setJwtId(UUID.randomUUID().toString());claims.setClaim("version",user.getAuthVersion());JsonWebSignature jws=new JsonWebSignature();jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.HMAC_SHA256);jws.setHeader("typ","JWT");jws.setKey(key);jws.setPayload(claims.toJson());return new Issued(jws.getCompactSerialization(),end);}catch(Exception e){throw new IllegalStateException("Cannot issue access token",e);}}
 public JwtClaims validate(String token){try{var claims=new JwtConsumerBuilder().setRequireExpirationTime().setRequireIssuedAt().setRequireSubject().setRequireJwtId().setExpectedIssuer("legaldesk").setExpectedAudience("legaldesk-web").setVerificationKey(key).setJwsAlgorithmConstraints(new AlgorithmConstraints(AlgorithmConstraints.ConstraintType.PERMIT,AlgorithmIdentifiers.HMAC_SHA256)).build().processToClaims(token);if(jdbc.queryForObject("SELECT COUNT(*) FROM auth_revoked_tokens WHERE jti=?",Long.class,claims.getJwtId())>0)throw new BadCredentialsException("Token revoked");return claims;}catch(Exception e){throw new BadCredentialsException("Invalid or expired token");}}
 public void revoke(String token){var claims=validate(token);try{jdbc.update("INSERT INTO auth_revoked_tokens(jti,expires_at) VALUES(?,?) ON CONFLICT DO NOTHING",claims.getJwtId(),OffsetDateTime.ofInstant(Instant.ofEpochSecond(claims.getExpirationTime().getValue()),ZoneOffset.UTC));}catch(MalformedClaimException e){throw new BadCredentialsException("Invalid token");}}
 @org.springframework.scheduling.annotation.Scheduled(fixedDelay=3600000)
 public void cleanExpired(){jdbc.update("DELETE FROM auth_revoked_tokens WHERE expires_at<NOW()");jdbc.update("DELETE FROM consultation_verifications WHERE created_at<NOW()-INTERVAL '7 days'");}
 public int minutes(){return settings.sessionMinutes();}
}
