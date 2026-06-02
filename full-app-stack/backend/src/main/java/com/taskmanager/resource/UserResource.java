package com.taskmanager.resource;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/me")
    @RolesAllowed({"admin", "project-manager", "developer", "viewer"})
    public Map<String, Object> getCurrentUser() {
        Map<String, Object> userInfo = new HashMap<>();

        userInfo.put("username", securityIdentity.getPrincipal().getName());
        userInfo.put("roles", securityIdentity.getRoles());

        if (jwt != null) {
            // KEYCLOAK: Basic identity claims from task:read scope
            if (jwt.getClaim("email") != null) {
                userInfo.put("email", jwt.getClaim("email"));
            }
            if (jwt.getClaim("name") != null) {
                userInfo.put("fullName", jwt.getClaim("name"));
            }
            if (jwt.getClaim("preferred_username") != null) {
                userInfo.put("preferredUsername", jwt.getClaim("preferred_username"));
            }
            if (jwt.getClaim("given_name") != null) {
                userInfo.put("firstName", jwt.getClaim("given_name"));
            }
            if (jwt.getClaim("family_name") != null) {
                userInfo.put("lastName", jwt.getClaim("family_name"));
            }

            // KEYCLOAK: Professional context claims from task:write scope
            if (jwt.getClaim("department") != null) {
                userInfo.put("department", jwt.getClaim("department"));
            }
            if (jwt.getClaim("job_title") != null) {
                userInfo.put("jobTitle", jwt.getClaim("job_title"));
            }
            if (jwt.getClaim("account_created_at") != null) {
                userInfo.put("accountCreatedAt", jwt.getClaim("account_created_at"));
            }

            // KEYCLOAK: Organizational structure claims from task:assign scope
            if (jwt.getClaim("team") != null) {
                userInfo.put("team", jwt.getClaim("team"));
            }
            if (jwt.getClaim("manager_email") != null) {
                userInfo.put("managerEmail", jwt.getClaim("manager_email"));
            }
            if (jwt.getClaim("groups") != null) {
                userInfo.put("groups", jwt.getClaim("groups"));
            }

            // KEYCLOAK: Admin metadata from admin:users scope
            if (jwt.getClaim("admin_level") != null) {
                userInfo.put("adminLevel", jwt.getClaim("admin_level"));
            }
            if (jwt.getClaim("admin_permissions") != null) {
                userInfo.put("adminPermissions", jwt.getClaim("admin_permissions"));
            }

            // KEYCLOAK: System claims from admin:stats scope
            if (jwt.getClaim("access_level") != null) {
                userInfo.put("accessLevel", jwt.getClaim("access_level"));
            }
            if (jwt.getClaim("token_purpose") != null) {
                userInfo.put("tokenPurpose", jwt.getClaim("token_purpose"));
            }

            // Standard JWT claims
            if (jwt.getClaim("scope") != null) {
                userInfo.put("scopes", jwt.getClaim("scope"));
            }
        }

        return userInfo;
    }

    /**
     * KEYCLOAK: Endpoint to demonstrate protocol mapper claims
     * Shows which claims are available based on the client's scopes
     */
    @GET
    @Path("/token-claims")
    @RolesAllowed({"admin", "project-manager", "developer", "viewer"})
    public Map<String, Object> getTokenClaims() {
        Map<String, Object> response = new HashMap<>();

        // Identity claims (from task:read scope)
        Map<String, Object> identityClaims = new HashMap<>();
        identityClaims.put("name", jwt.getClaim("name"));
        identityClaims.put("email", jwt.getClaim("email"));
        identityClaims.put("preferred_username", jwt.getClaim("preferred_username"));
        response.put("identity", identityClaims);

        // Professional claims (from task:write scope)
        Map<String, Object> professionalClaims = new HashMap<>();
        professionalClaims.put("department", jwt.getClaim("department"));
        professionalClaims.put("job_title", jwt.getClaim("job_title"));
        professionalClaims.put("account_created_at", jwt.getClaim("account_created_at"));
        response.put("professional", professionalClaims);

        // Organizational claims (from task:assign scope)
        Map<String, Object> organizationalClaims = new HashMap<>();
        organizationalClaims.put("team", jwt.getClaim("team"));
        organizationalClaims.put("manager_email", jwt.getClaim("manager_email"));
        organizationalClaims.put("groups", jwt.getClaim("groups"));
        response.put("organizational", organizationalClaims);

        // Admin claims (from admin:users scope)
        Map<String, Object> adminClaims = new HashMap<>();
        adminClaims.put("admin_level", jwt.getClaim("admin_level"));
        adminClaims.put("admin_permissions", jwt.getClaim("admin_permissions"));
        response.put("admin", adminClaims);

        // System claims (from admin:stats scope)
        Map<String, Object> systemClaims = new HashMap<>();
        systemClaims.put("access_level", jwt.getClaim("access_level"));
        systemClaims.put("token_purpose", jwt.getClaim("token_purpose"));
        systemClaims.put("audience", jwt.getAudience());
        response.put("system", systemClaims);

        // Metadata
        response.put("scopes", jwt.getClaim("scope"));
        response.put("issued_at", jwt.getIssuedAtTime());
        response.put("expires_at", jwt.getExpirationTime());

        return response;
    }
}
