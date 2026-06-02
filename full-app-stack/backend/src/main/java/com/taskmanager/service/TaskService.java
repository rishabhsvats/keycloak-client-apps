package com.taskmanager.service;

import com.taskmanager.dto.CreateTaskDto;
import com.taskmanager.entity.Project;
import com.taskmanager.entity.Task;
import com.taskmanager.entity.TaskStatus;
import com.taskmanager.repository.TaskRepository;
import io.quarkus.security.ForbiddenException;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

@ApplicationScoped
public class TaskService {

    @Inject
    TaskRepository taskRepository;

    @Inject
    ProjectService projectService;

    @Inject
    SecurityIdentity securityIdentity;

    public List<Task> getAllTasks() {
        return taskRepository.findAllOrdered();
    }

    public Task getTaskById(Long id) {
        Task task = taskRepository.findById(id);
        if (task == null) {
            throw new NotFoundException("Task not found with id: " + id);
        }
        return task;
    }

    public List<Task> getTasksByProject(Long projectId) {
        return taskRepository.findByProject(projectId);
    }

    @Transactional
    public Task createTask(CreateTaskDto dto, Long projectId) {
        Project project = projectService.getProjectById(projectId);

        validateProjectManagement(project);

        Task task = new Task();
        task.title = dto.title;
        task.description = dto.description;
        task.status = dto.status != null ? dto.status : TaskStatus.TODO;
        task.project = project;

        taskRepository.persist(task);
        return task;
    }

    @Transactional
    public Task updateTask(Long id, Task updatedTask) {
        Task task = getTaskById(id);

        validateProjectManagement(task.project);

        task.title = updatedTask.title;
        task.description = updatedTask.description;
        task.status = updatedTask.status;

        return task;
    }

    @Transactional
    public Task updateTaskStatus(Long id, TaskStatus newStatus) {
        Task task = getTaskById(id);

        String userId = securityIdentity.getPrincipal().getName();
        boolean isAdmin = securityIdentity.hasRole("admin");
        boolean isProjectManager = securityIdentity.hasRole("project-manager");
        boolean isDeveloper = securityIdentity.hasRole("developer");
        boolean isAssignee = task.assigneeUserId != null && task.assigneeUserId.equals(userId);

        if (!isAdmin && !isProjectManager && !(isDeveloper && isAssignee)) {
            throw new ForbiddenException("You can only update status of tasks assigned to you");
        }

        task.status = newStatus;
        return task;
    }

    @Transactional
    public Task assignTask(Long id, String assigneeUserId) {
        Task task = getTaskById(id);

        validateProjectManagement(task.project);

        task.assigneeUserId = assigneeUserId;
        return task;
    }

    @Transactional
    public void deleteTask(Long id) {
        Task task = getTaskById(id);

        validateProjectManagement(task.project);

        taskRepository.delete(task);
    }

    private void validateProjectManagement(Project project) {
        String userId = securityIdentity.getPrincipal().getName();
        boolean isAdmin = securityIdentity.hasRole("admin");
        boolean isProjectOwner = project.creatorUserId.equals(userId);

        if (!isAdmin && !isProjectOwner) {
            throw new ForbiddenException("You can only manage tasks in projects you created");
        }
    }
}
