package com.legaldesk.modules.auth.api;
import jakarta.validation.constraints.*;
public record LoginRequest(@NotBlank @Pattern(regexp="[0-9]{14}") String nationalId,@NotBlank @Size(max=128) String password){}
