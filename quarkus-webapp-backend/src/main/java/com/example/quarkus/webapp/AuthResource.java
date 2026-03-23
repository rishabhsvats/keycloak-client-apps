package com.example.quarkus.webapp;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Auth entry points for SPAs.
 * - GET /api/auth/login: when called without a session, OIDC redirects to Keycloak; after login, user is back here (authenticated).
 * - GET /api/auth/logout: trigger RP-initiated logout (redirect to Keycloak end-session).
 */
@Path("/api/auth")
public class AuthResource {

    @GET
    @Path("/login")
    @Produces(MediaType.APPLICATION_JSON)
    public Response login() {
        // Only reached when already authenticated (otherwise OIDC redirects to Keycloak).
        return Response.ok()
                .entity(java.util.Map.of("message", "Already logged in", "status", "ok"))
                .build();
    }

    @GET
    @Path("/logout")
    public Response logout() {
        // Logout is handled by Quarkus OIDC (end-session redirect). This resource is protected;
        // use the built-in logout by redirecting to the end-session endpoint.
        return Response.status(Response.Status.NO_CONTENT).build();
    }
}
