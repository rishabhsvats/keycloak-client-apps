package com.example.quarkus;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.oidc.AccessTokenCredential;
import io.quarkus.security.identity.SecurityIdentity;
import org.jboss.resteasy.reactive.NoCache;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Path("/api/secured")
@Produces(MediaType.APPLICATION_JSON)
public class SecuredResource {

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    ObjectMapper objectMapper;

    /**
     * Returns the full Bearer token (raw and decoded payload) for the current request.
     * Useful for debugging. In production you may want to remove or restrict this endpoint.
     */
    @GET
    @Path("/token")
    @NoCache
    public Map<String, Object> token() {
        AccessTokenCredential credential = securityIdentity.getCredential(AccessTokenCredential.class);
        String rawToken = credential != null ? credential.getToken() : null;

        if (rawToken == null) {
            return Map.of(
                    "message", "No Bearer token found",
                    "rawToken", "",
                    "decodedPayload", Map.of()
            );
        }

        // Print complete token to log
        System.out.println("=== Bearer token (complete) ===");
        System.out.println(rawToken);
        System.out.println("=== End token ===");

        Map<String, Object> decodedPayload = decodeJwtPayload(rawToken, objectMapper);

        return Map.of(
                "message", "Token consumed and printed to server log",
                "rawToken", rawToken,
                "decodedPayload", decodedPayload
        );
    }

    @GET
    @Path("/me")
    @NoCache
    public Map<String, Object> me() {
        String user = securityIdentity.getPrincipal() != null ? securityIdentity.getPrincipal().getName() : "authenticated";
        return Map.of(
                "message", "Secured endpoint - you are authenticated",
                "user", user
        );
    }

    @GET
    @Path("/data")
    @NoCache
    public Map<String, Object> data() {
        return Map.of(
                "message", "Protected data",
                "items", List.of(
                        Map.of("id", 1, "name", "Item A", "type", "secured"),
                        Map.of("id", 2, "name", "Item B", "type", "secured")
                )
        );
    }

    @GET
    @Path("/admin")
    @RolesAllowed("admin")
    @NoCache
    public Map<String, Object> admin() {
        return Map.of(
                "message", "Admin-only endpoint",
                "note", "Only users with realm role 'admin' can access this."
        );
    }

    /**
     * Decode JWT payload (middle part) without verification (token already verified by OIDC).
     * Returns map of claims, or map with "payloadJson" / "error" if not a JWT or parsing fails.
     */
    private static Map<String, Object> decodeJwtPayload(String token, ObjectMapper objectMapper) {
        if (token == null || !token.contains(".")) {
            return Map.of();
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return Map.of();
        }
        try {
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));
            return objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of("error", "Opaque or invalid token", "message", e.getMessage());
        }
    }
}
