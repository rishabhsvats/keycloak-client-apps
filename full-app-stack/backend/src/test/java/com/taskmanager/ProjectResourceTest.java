package com.taskmanager;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class ProjectResourceTest {

    @Test
    public void testGetProjectsEndpointWithoutAuth() {
        // Test: 401 without token
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "viewer@taskmanager.com", roles = {"viewer"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testGetProjectsWithViewerRole() {
        // Test: Viewer can read projects with task:read scope
        given()
            .when().get("/api/projects")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "dev@taskmanager.com", roles = {"developer"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read task:write")
    })
    public void testCreateProjectWithDeveloperRole() {
        // Test: Developer cannot create projects (403) - lacks required role
        String projectJson = """
            {
                "name": "Test Project",
                "description": "Test Description"
            }
        """;

        given()
            .contentType("application/json")
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(403);
    }

    @Test
    @TestSecurity(user = "manager@taskmanager.com", roles = {"project-manager"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testCreateProjectWithoutWriteScope() {
        // Test: task:write scope required for POST /api/projects
        String projectJson = """
            {
                "name": "Test Project",
                "description": "Test Description"
            }
        """;

        given()
            .contentType("application/json")
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(401); // Scope check returns 401
    }

    @Test
    @TestSecurity(user = "manager@taskmanager.com", roles = {"project-manager"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read task:write task:assign")
    })
    public void testCreateProjectWithProjectManagerRole() {
        // Test: Project Manager can create projects with task:write scope
        String projectJson = """
            {
                "name": "Test Project",
                "description": "Test Description"
            }
        """;

        given()
            .contentType("application/json")
            .body(projectJson)
            .when().post("/api/projects")
            .then()
            .statusCode(201);
    }

    @Test
    @TestSecurity(user = "admin@taskmanager.com", roles = {"admin"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read task:write task:assign")
    })
    public void testAdminCanDeleteAnyProject() {
        // Test: Admin can delete any project (even if not creator)
        // First create a project as manager
        String projectJson = """
            {
                "name": "Manager Project",
                "description": "Created by manager"
            }
        """;

        // Note: In a real test, we'd create as manager first
        // For this demonstration, we're showing admin can delete
        given()
            .when().delete("/api/projects/1")
            .then()
            .statusCode(204);
    }

    @Test
    @TestSecurity(user = "manager@taskmanager.com", roles = {"project-manager"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read task:write")
    })
    public void testProjectManagerCanOnlyUpdateOwnProjects() {
        // Test: Project Manager can only update projects they created
        // Attempting to update project created by admin (id=2 in import.sql)
        String projectJson = """
            {
                "name": "Updated Project",
                "description": "Trying to update admin's project"
            }
        """;

        given()
            .contentType("application/json")
            .body(projectJson)
            .when().put("/api/projects/2")
            .then()
            .statusCode(403); // Ownership validation fails
    }
}
