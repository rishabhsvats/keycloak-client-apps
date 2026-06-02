package com.taskmanager.resource;

import com.taskmanager.dto.AssignTaskDto;
import com.taskmanager.dto.CreateTaskDto;
import com.taskmanager.dto.UpdateTaskStatusDto;
import com.taskmanager.entity.Task;
import com.taskmanager.security.RequiresScope;
import com.taskmanager.service.TaskService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/tasks")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TaskResource {

    @Inject
    TaskService taskService;

    @GET
    @RequiresScope("task:read")
    @RolesAllowed({"admin", "project-manager", "developer", "viewer"})
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    @GET
    @Path("/{id}")
    @RequiresScope("task:read")
    @RolesAllowed({"admin", "project-manager", "developer", "viewer"})
    public Task getTask(@PathParam("id") Long id) {
        return taskService.getTaskById(id);
    }

    @POST
    @RequiresScope("task:write")
    @RolesAllowed({"admin", "project-manager"})
    public Response createTask(@Valid CreateTaskDto dto, @QueryParam("projectId") Long projectId) {
        if (projectId == null) {
            throw new BadRequestException("Project ID is required");
        }
        Task created = taskService.createTask(dto, projectId);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @RequiresScope("task:write")
    @RolesAllowed({"admin", "project-manager"})
    public Task updateTask(@PathParam("id") Long id, @Valid Task task) {
        return taskService.updateTask(id, task);
    }

    @PATCH
    @Path("/{id}/status")
    @RequiresScope({"task:write", "task:read"})
    @RolesAllowed({"admin", "project-manager", "developer"})
    public Task updateTaskStatus(@PathParam("id") Long id, @Valid UpdateTaskStatusDto dto) {
        return taskService.updateTaskStatus(id, dto.status);
    }

    @PATCH
    @Path("/{id}/assign")
    @RequiresScope("task:assign")
    @RolesAllowed({"admin", "project-manager"})
    public Task assignTask(@PathParam("id") Long id, @Valid AssignTaskDto dto) {
        return taskService.assignTask(id, dto.assigneeUserId);
    }

    @DELETE
    @Path("/{id}")
    @RequiresScope("task:write")
    @RolesAllowed({"admin", "project-manager"})
    public Response deleteTask(@PathParam("id") Long id) {
        taskService.deleteTask(id);
        return Response.noContent().build();
    }
}
