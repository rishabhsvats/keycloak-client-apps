package com.taskmanager.repository;

import com.taskmanager.entity.Task;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class TaskRepository implements PanacheRepository<Task> {

    public List<Task> findByProject(Long projectId) {
        return list("project.id", projectId);
    }

    public List<Task> findByAssignee(String assigneeUserId) {
        return list("assigneeUserId", assigneeUserId);
    }

    public List<Task> findAllOrdered() {
        return listAll(io.quarkus.panache.common.Sort.descending("createdDate"));
    }
}
