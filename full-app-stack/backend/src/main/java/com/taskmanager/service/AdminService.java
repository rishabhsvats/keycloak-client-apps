package com.taskmanager.service;

import com.taskmanager.entity.Project;
import com.taskmanager.entity.Task;
import com.taskmanager.repository.ProjectRepository;
import com.taskmanager.repository.TaskRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class AdminService {

    @Inject
    ProjectRepository projectRepository;

    @Inject
    TaskRepository taskRepository;

    @ConfigProperty(name = "quarkus.oidc.auth-server-url")
    String authServerUrl;

    public Map<String, Object> getSystemStats() {
        long totalProjects = projectRepository.count();
        long totalTasks = taskRepository.count();

        long todoTasks = taskRepository.count("status", com.taskmanager.entity.TaskStatus.TODO);
        long inProgressTasks = taskRepository.count("status", com.taskmanager.entity.TaskStatus.IN_PROGRESS);
        long doneTasks = taskRepository.count("status", com.taskmanager.entity.TaskStatus.DONE);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProjects", totalProjects);
        stats.put("totalTasks", totalTasks);
        stats.put("todoTasks", todoTasks);
        stats.put("inProgressTasks", inProgressTasks);
        stats.put("doneTasks", doneTasks);

        return stats;
    }

    public List<Map<String, Object>> getActivityLog() {
        List<Map<String, Object>> activities = new ArrayList<>();

        List<Project> recentProjects = projectRepository.find(
                "ORDER BY createdDate DESC"
        ).page(0, 10).list();

        for (Project project : recentProjects) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "project_created");
            activity.put("description", "Project '" + project.name + "' created");
            activity.put("userId", project.creatorUserId);
            activity.put("timestamp", project.createdDate);
            activity.put("entityId", project.id);
            activities.add(activity);
        }

        List<Task> recentTasks = taskRepository.find(
                "ORDER BY createdDate DESC"
        ).page(0, 10).list();

        for (Task task : recentTasks) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "task_created");
            activity.put("description", "Task '" + task.title + "' created");
            activity.put("userId", task.project.creatorUserId);
            activity.put("timestamp", task.createdDate);
            activity.put("entityId", task.id);
            activities.add(activity);
        }

        return activities.stream()
                .sorted((a, b) -> ((LocalDateTime) b.get("timestamp")).compareTo((LocalDateTime) a.get("timestamp")))
                .limit(20)
                .collect(Collectors.toList());
    }
}
