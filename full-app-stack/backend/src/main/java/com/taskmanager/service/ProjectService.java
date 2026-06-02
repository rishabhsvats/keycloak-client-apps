package com.taskmanager.service;

import com.taskmanager.dto.CreateProjectDto;
import com.taskmanager.entity.Project;
import com.taskmanager.repository.ProjectRepository;
import io.quarkus.security.ForbiddenException;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.List;

@ApplicationScoped
public class ProjectService {

    @Inject
    ProjectRepository projectRepository;

    @Inject
    SecurityIdentity securityIdentity;

    public List<Project> getAllProjects() {
        return projectRepository.findAllOrdered();
    }

    public Project getProjectById(Long id) {
        Project project = projectRepository.findById(id);
        if (project == null) {
            throw new NotFoundException("Project not found with id: " + id);
        }
        return project;
    }

    @Transactional
    public Project createProject(CreateProjectDto dto) {
        String userId = securityIdentity.getPrincipal().getName();

        Project project = new Project();
        project.name = dto.name;
        project.description = dto.description;
        project.creatorUserId = userId;

        projectRepository.persist(project);
        return project;
    }

    @Transactional
    public Project updateProject(Long id, Project updatedProject) {
        Project project = getProjectById(id);

        validateProjectOwnership(project);

        project.name = updatedProject.name;
        project.description = updatedProject.description;

        return project;
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = getProjectById(id);

        validateProjectOwnership(project);

        projectRepository.delete(project);
    }

    private void validateProjectOwnership(Project project) {
        String userId = securityIdentity.getPrincipal().getName();
        boolean isAdmin = securityIdentity.hasRole("admin");

        if (!isAdmin && !project.creatorUserId.equals(userId)) {
            throw new ForbiddenException("You can only modify projects you created");
        }
    }
}
