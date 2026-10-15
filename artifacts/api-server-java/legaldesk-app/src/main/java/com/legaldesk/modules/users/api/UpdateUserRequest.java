package com.legaldesk.modules.users.api;
import jakarta.validation.constraints.*;
public record UpdateUserRequest(@Size(min=1,max=200) String name,@Pattern(regexp="[0-9]{14}") String nationalId,@Email @Size(max=254) String email,@Size(max=40) String phone,String role,Boolean active,@Size(min=10,max=128) String password){}
