package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.saml2.core.Saml2ResponseValidatorResult;
import org.springframework.security.saml2.provider.service.authentication.OpenSaml4AuthenticationProvider;
import org.springframework.security.web.SecurityFilterChain;

/**
 * SAML login with no signing and no cryptographic validation of responses/assertions.
 * <p><b>Local demos only</b> — do not use in production.</p>
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        OpenSaml4AuthenticationProvider saml = new OpenSaml4AuthenticationProvider();
        saml.setResponseValidator(token -> Saml2ResponseValidatorResult.success());
        saml.setAssertionValidator(token -> Saml2ResponseValidatorResult.success());

        http
            .authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated()
            )
            .saml2Login(saml2 -> saml2.authenticationManager(new ProviderManager(saml)));

        return http.build();
    }
}
