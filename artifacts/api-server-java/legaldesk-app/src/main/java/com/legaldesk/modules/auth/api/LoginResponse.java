package com.legaldesk.modules.auth.api;
public record LoginResponse(AuthUserResponse user,String token,java.time.Instant expiresAt){}
