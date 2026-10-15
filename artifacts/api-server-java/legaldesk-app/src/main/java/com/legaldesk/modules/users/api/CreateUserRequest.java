package com.legaldesk.modules.users.api;
import jakarta.validation.constraints.*;
public record CreateUserRequest(@NotBlank @Size(max=200) String name,@NotBlank @Pattern(regexp="[0-9]{14}") String nationalId,@Email @Size(max=254) String email,@NotBlank @Size(min=10,max=128) String password,@Size(max=40) String phone,@NotBlank String role){}
