package com.example.quarkus.webapp;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import io.quarkus.security.identity.SecurityIdentity;
import org.jboss.resteasy.reactive.NoCache;

import java.util.List;
import java.util.Map;

@Path("/api/secured")
@Produces(MediaType.APPLICATION_JSON)
public class SecuredResource {

    @Inject
    SecurityIdentity securityIdentity;

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
}
