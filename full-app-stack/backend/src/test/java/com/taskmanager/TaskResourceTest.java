package com.taskmanager;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class TaskResourceTest {

    @Test
    public void testGetTasksWithoutAuth() {
        // Test: 401 without token
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "viewer@taskmanager.com", roles = {"viewer"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testViewerCanReadTasks() {
        // Test: Viewer can read tasks with task:read scope
        given()
            .when().get("/api/tasks")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "manager@taskmanager.com", roles = {"project-manager"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testCreateTaskRequiresWriteScope() {
        // Test: task:write scope required for POST /api/tasks
        String taskJson = """
            {
                "title": "Test Task",
                "description": "Test Description",
                "status": "TODO"
            }
        """;

        given()
            .contentType("application/json")
            .body(taskJson)
            .queryParam("projectId", 1)
            .when().post("/api/tasks")
            .then()
            .statusCode(401); // Scope check returns 401
    }

    @Test
    @TestSecurity(user = "dev@taskmanager.com", roles = {"developer"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read task:write")
    })
    public void testDeveloperCannotCreateTasks() {
        // Test: Developer cannot create tasks (lacks required role)
        String taskJson = """
            {
                "title": "Test Task",
                "description": "Test Description",
                "status": "TODO"
            }
        """;

        given()
            .contentType("application/json")
            .body(taskJson)
            .queryParam("projectId", 1)
            .when().post("/api/tasks")
            .then()
            .statusCode(403); // Role check fails
    }

    @Test
    @TestSecurity(user = "dev@taskmanager.com", roles = {"developer"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testDeveloperCanUpdateAssignedTaskStatus() {
        // Test: Developer can update status of assigned tasks with task:read scope
        // Task id=2 in import.sql is assigned to dev@taskmanager.com
        String statusJson = """
            {
                "status": "IN_PROGRESS"
            }
        """;

        given()
            .contentType("application/json")
            .body(statusJson)
            .when().patch("/api/tasks/2/status")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "dev@taskmanager.com", roles = {"developer"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testDeveloperCannotUpdateUnassignedTaskStatus() {
        // Test: Developer cannot update status of tasks not assigned to them
        // Task id=3 in import.sql has no assignee
        String statusJson = """
            {
                "status": "IN_PROGRESS"
            }
        """;

        given()
            .contentType("application/json")
            .body(statusJson)
            .when().patch("/api/tasks/3/status")
            .then()
            .statusCode(403); // Not assigned to this developer
    }

    @Test
    @TestSecurity(user = "manager@taskmanager.com", roles = {"project-manager"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testAssignTaskRequiresAssignScope() {
        // Test: task:assign scope required for PATCH /api/tasks/{id}/assign
        String assignJson = """
            {
                "assigneeUserId": "dev@taskmanager.com"
            }
        """;

        given()
            .contentType("application/json")
            .body(assignJson)
            .when().patch("/api/tasks/1/assign")
            .then()
            .statusCode(401); // Missing task:assign scope
    }

    @Test
    @TestSecurity(user = "manager@taskmanager.com", roles = {"project-manager"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read task:assign")
    })
    public void testProjectManagerCanAssignTasks() {
        // Test: Project Manager can assign tasks with task:assign scope
        String assignJson = """
            {
                "assigneeUserId": "dev@taskmanager.com"
            }
        """;

        given()
            .contentType("application/json")
            .body(assignJson)
            .when().patch("/api/tasks/1/assign")
            .then()
            .statusCode(200);
    }
}
