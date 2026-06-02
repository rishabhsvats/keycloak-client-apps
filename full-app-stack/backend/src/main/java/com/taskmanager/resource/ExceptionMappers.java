package com.taskmanager.resource;

import io.quarkus.security.ForbiddenException;
import io.quarkus.security.UnauthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.HashMap;
import java.util.Map;

@Provider
public class ExceptionMappers {

    @Provider
    public static class NotFoundExceptionMapper implements ExceptionMapper<NotFoundException> {
        @Override
        public Response toResponse(NotFoundException exception) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Not Found");
            error.put("message", exception.getMessage());
            return Response.status(Response.Status.NOT_FOUND).entity(error).build();
        }
    }

    @Provider
    public static class ForbiddenExceptionMapper implements ExceptionMapper<ForbiddenException> {
        @Override
        public Response toResponse(ForbiddenException exception) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Forbidden");
            error.put("message", exception.getMessage());
            return Response.status(Response.Status.FORBIDDEN).entity(error).build();
        }
    }

    @Provider
    public static class UnauthorizedExceptionMapper implements ExceptionMapper<UnauthorizedException> {
        @Override
        public Response toResponse(UnauthorizedException exception) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Unauthorized");
            error.put("message", exception.getMessage());
            return Response.status(Response.Status.UNAUTHORIZED).entity(error).build();
        }
    }
}
