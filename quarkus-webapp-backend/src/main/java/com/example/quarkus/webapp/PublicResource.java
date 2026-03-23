package com.example.quarkus.webapp;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.util.Map;

@Path("/api/public")
@Produces(MediaType.APPLICATION_JSON)
public class PublicResource {

    @GET
    @Path("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "service", "quarkus-webapp-backend",
                "timestamp", Instant.now().toString(),
                "message", "Public endpoint - no authentication required"
        );
    }

    @GET
    @Path("/info")
    public Map<String, Object> info() {
        return Map.of(
                "message", "This is a public endpoint. Anyone can access it.",
                "version", "1.0.0"
        );
    }
}
