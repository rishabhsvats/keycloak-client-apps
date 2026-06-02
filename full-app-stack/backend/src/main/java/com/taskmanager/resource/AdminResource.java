package com.taskmanager.resource;

import com.taskmanager.security.RequiresScope;
import com.taskmanager.service.AdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.*;

@Path("/api/admin")
@Produces(MediaType.APPLICATION_JSON)
public class AdminResource {

    @Inject
    AdminService adminService;

    @GET
    @Path("/users")
    @RequiresScope("admin:users")
    @RolesAllowed("admin")
    public List<Map<String, Object>> getUsers() {
        List<Map<String, Object>> users = new ArrayList<>();

        Map<String, Object> admin = new HashMap<>();
        admin.put("id", "admin-user-id");
        admin.put("username", "admin@taskmanager.com");
        admin.put("email", "admin@taskmanager.com");
        admin.put("firstName", "Admin");
        admin.put("lastName", "User");
        admin.put("enabled", true);
        admin.put("roles", Arrays.asList("admin"));
        users.add(admin);

        Map<String, Object> manager = new HashMap<>();
        manager.put("id", "manager-user-id");
        manager.put("username", "manager@taskmanager.com");
        manager.put("email", "manager@taskmanager.com");
        manager.put("firstName", "Project");
        manager.put("lastName", "Manager");
        manager.put("enabled", true);
        manager.put("roles", Arrays.asList("project-manager"));
        users.add(manager);

        Map<String, Object> dev = new HashMap<>();
        dev.put("id", "dev-user-id");
        dev.put("username", "dev@taskmanager.com");
        dev.put("email", "dev@taskmanager.com");
        dev.put("firstName", "Developer");
        dev.put("lastName", "User");
        dev.put("enabled", true);
        dev.put("roles", Arrays.asList("developer"));
        users.add(dev);

        Map<String, Object> viewer = new HashMap<>();
        viewer.put("id", "viewer-user-id");
        viewer.put("username", "viewer@taskmanager.com");
        viewer.put("email", "viewer@taskmanager.com");
        viewer.put("firstName", "Viewer");
        viewer.put("lastName", "User");
        viewer.put("enabled", true);
        viewer.put("roles", Arrays.asList("viewer"));
        users.add(viewer);

        return users;
    }

    @GET
    @Path("/stats")
    @RequiresScope("admin:stats")
    @RolesAllowed("admin")
    public Map<String, Object> getStats() {
        return adminService.getSystemStats();
    }

    @GET
    @Path("/activity")
    @RequiresScope("admin:stats")
    @RolesAllowed("admin")
    public List<Map<String, Object>> getActivityLog() {
        return adminService.getActivityLog();
    }
}
