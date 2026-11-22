package com.legaldesk;

import com.legaldesk.shared.bootstrap.EnvironmentOwnerBootstrap;
import com.legaldesk.modules.users.domain.UserEntity;
import com.legaldesk.modules.users.infrastructure.UserEntityRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EnvironmentOwnerBootstrapTest {
    @Test void existingOfficeIsNeverModifiedByBootstrapCredentials() {
        var users=mock(UserEntityRepository.class);when(users.count()).thenReturn(1L);
        new EnvironmentOwnerBootstrap(users,new BCryptPasswordEncoder(),"","","","").run();
        verify(users,never()).saveAndFlush(any());
    }
    @Test void newOwnerUsesIdentityHashedPasswordAndMandatoryFirstPasswordChange() {
        var users=mock(UserEntityRepository.class);var encoder=new BCryptPasswordEncoder();
        new EnvironmentOwnerBootstrap(users,encoder,"12345678901234","OWNER@EXAMPLE.TEST","+20 01000000000","temporaryPass123").run();
        var capture=ArgumentCaptor.forClass(UserEntity.class);verify(users).saveAndFlush(capture.capture());
        var owner=capture.getValue();assertEquals("owner",owner.getRole());assertEquals("12345678901234",owner.getNationalId());
        assertEquals("owner@example.test",owner.getEmail());assertEquals("+201000000000",owner.getPhone());
        assertTrue(owner.isMustChangePassword());assertTrue(owner.isActive());assertTrue(encoder.matches("temporaryPass123",owner.getPasswordHash()));
    }
    @Test void emptyDatabaseWithoutConfiguredCredentialsCannotStartWithAnInsecureDefault() {
        var users=mock(UserEntityRepository.class);
        assertThrows(IllegalStateException.class,()->new EnvironmentOwnerBootstrap(users,new BCryptPasswordEncoder(),"","","","").run());
        verify(users,never()).saveAndFlush(any());
    }
}
