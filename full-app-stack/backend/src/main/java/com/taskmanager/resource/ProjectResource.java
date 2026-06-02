package com.taskmanager.resource;

import com.taskmanager.dto.CreateProjectDto;
import com.taskmanager.entity.Project;
import com.taskmanager.entity.Task;
import com.taskmanager.security.RequiresScope;
import com.taskmanager.service.ProjectService;
import com.taskmanager.service.TaskService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/projects")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProjectResource {

    @Inject
    ProjectService projectService;

    @Inject
    TaskService taskService;

    @GET
    @RequiresScope("task:read")
    @RolesAllowed({"admin", "project-manager", "developer", "viewer"})
    public List<Project> getAllProjects() {
        return projectService.getAllProjects();
    }

    @GET
    @Path("/{id}")
    @RequiresScope("task:read")
    @RolesAllowed({"admin", "project-manager", "developer", "viewer"})
    public Project getProject(@PathParam("id") Long id) {
        return projectService.getProjectById(id);
    }

    @POST
    @RequiresScope("task:write")
    @RolesAllowed({"admin", "project-manager"})
    public Response createProject(@Valid CreateProjectDto dto) {
        Project created = projectService.createProject(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @RequiresScope("task:write")
    @RolesAllowed({"admin", "project-manager"})
    public Project updateProject(@PathParam("id") Long id, @Valid Project project) {
        return projectService.updateProject(id, project);
    }

    @DELETE
    @Path("/{id}")
    @RequiresScope("task:write")
    @RolesAllowed({"admin", "project-manager"})
    public Response deleteProject(@PathParam("id") Long id) {
        projectService.deleteProject(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}/tasks")
    @RequiresScope("task:read")
    @RolesAllowed({"admin", "project-manager", "developer", "viewer"})
    public List<Task> getProjectTasks(@PathParam("id") Long id) {
        return taskService.getTasksByProject(id);
    }
}
