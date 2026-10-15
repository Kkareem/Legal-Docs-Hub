package com.legaldesk.shared.bootstrap;

import com.legaldesk.modules.users.domain.UserEntity;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import com.legaldesk.shared.security.ContactDetails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Provision the initial owner only in a new staging/production database. */
@Component
@Profile({"stg", "prod"})
public class EnvironmentOwnerBootstrap implements CommandLineRunner {
    private final UserEntityRepository users;
    private final PasswordEncoder encoder;
    private final String identity, email, phone, password;

    public EnvironmentOwnerBootstrap(UserEntityRepository users, PasswordEncoder encoder,
            @Value("${BOOTSTRAP_OWNER_NATIONAL_ID:}") String identity,
            @Value("${BOOTSTRAP_OWNER_EMAIL:}") String email,
            @Value("${BOOTSTRAP_OWNER_PHONE:}") String phone,
            @Value("${BOOTSTRAP_OWNER_PASSWORD:}") String password) {
        this.users=users;this.encoder=encoder;this.identity=identity;this.email=email;this.phone=phone;this.password=password;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count()>0) return;
        if (identity.isBlank() || password.length()<10 || password.length()>128 || password.startsWith("replace-"))
            throw new IllegalStateException("Empty database: configure BOOTSTRAP_OWNER_NATIONAL_ID and BOOTSTRAP_OWNER_PASSWORD (10-128 characters), plus owner email or phone");
        String normalizedEmail=ContactDetails.email(email),normalizedPhone=ContactDetails.phone(phone);
        ContactDetails.requireContact(normalizedEmail,normalizedPhone);
        var owner=new UserEntity();
        owner.setName("مدير المكتب");owner.setNationalId(ContactDetails.identity(identity));
        owner.setEmail(normalizedEmail);owner.setPhone(normalizedPhone);owner.setRole("owner");
        owner.setPasswordHash(encoder.encode(password));owner.setActive(true);owner.setMustChangePassword(true);
        users.saveAndFlush(owner);
    }
}
