package com.taskmanager.security;

import io.quarkus.security.UnauthorizedException;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@RequiresScope
@Interceptor
@Priority(Interceptor.Priority.PLATFORM_BEFORE + 200)
public class ScopeCheckInterceptor {

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    JsonWebToken jwt;

    @AroundInvoke
    public Object checkScope(InvocationContext context) throws Exception {
        RequiresScope annotation = context.getMethod().getAnnotation(RequiresScope.class);

        if (annotation == null) {
            annotation = context.getTarget().getClass().getAnnotation(RequiresScope.class);
        }

        if (annotation != null && annotation.value().length > 0) {
            String[] requiredScopes = annotation.value();
            Set<String> tokenScopes = extractScopes();

            boolean hasRequiredScope = Arrays.stream(requiredScopes)
                    .anyMatch(tokenScopes::contains);

            if (!hasRequiredScope) {
                throw new UnauthorizedException(
                    "Access denied. Required scope(s): " + String.join(", ", requiredScopes)
                );
            }
        }

        return context.proceed();
    }

    private Set<String> extractScopes() {
        Set<String> scopes = new HashSet<>();

        if (jwt != null && jwt.getClaim("scope") != null) {
            String scopeString = jwt.getClaim("scope");
            scopes.addAll(Arrays.asList(scopeString.split(" ")));
        }

        return scopes;
    }
}
