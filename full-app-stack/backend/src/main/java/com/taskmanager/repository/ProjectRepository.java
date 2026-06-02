package com.taskmanager.repository;

import com.taskmanager.entity.Project;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class ProjectRepository implements PanacheRepository<Project> {

    public List<Project> findByCreator(String creatorUserId) {
        return list("creatorUserId", creatorUserId);
    }

    public List<Project> findAllOrdered() {
        return listAll(io.quarkus.panache.common.Sort.descending("createdDate"));
    }
}
