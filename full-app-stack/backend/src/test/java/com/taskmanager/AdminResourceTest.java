package com.taskmanager;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class AdminResourceTest {

    @Test
    public void testGetUsersWithoutAuth() {
        // Test: 401 without token
        given()
            .when().get("/api/admin/users")
            .then()
            .statusCode(401);
    }

    @Test
    @TestSecurity(user = "manager@taskmanager.com", roles = {"project-manager"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read admin:users")
    })
    public void testNonAdminCannotAccessAdminEndpoints() {
        // Test: Admin role required for /api/admin/* endpoints
        given()
            .when().get("/api/admin/users")
            .then()
            .statusCode(403); // Lacks admin role
    }

    @Test
    @TestSecurity(user = "admin@taskmanager.com", roles = {"admin"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testAdminUsersRequiresAdminUsersScope() {
        // Test: admin:users scope required for GET /api/admin/users
        given()
            .when().get("/api/admin/users")
            .then()
            .statusCode(401); // Missing admin:users scope
    }

    @Test
    @TestSecurity(user = "admin@taskmanager.com", roles = {"admin"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read admin:users")
    })
    public void testAdminCanAccessUsersWithCorrectScope() {
        // Test: Admin can access /api/admin/users with admin:users scope
        given()
            .when().get("/api/admin/users")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "admin@taskmanager.com", roles = {"admin"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read")
    })
    public void testAdminStatsRequiresAdminStatsScope() {
        // Test: admin:stats scope required for GET /api/admin/stats
        given()
            .when().get("/api/admin/stats")
            .then()
            .statusCode(401); // Missing admin:stats scope
    }

    @Test
    @TestSecurity(user = "admin@taskmanager.com", roles = {"admin"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read admin:stats")
    })
    public void testAdminCanAccessStatsWithCorrectScope() {
        // Test: Admin can access /api/admin/stats with admin:stats scope
        given()
            .when().get("/api/admin/stats")
            .then()
            .statusCode(200);
    }

    @Test
    @TestSecurity(user = "admin@taskmanager.com", roles = {"admin"})
    @OidcSecurity(claims = {
        @Claim(key = "scope", value = "openid profile email task:read admin:stats")
    })
    public void testAdminCanAccessActivityLog() {
        // Test: Admin can access /api/admin/activity with admin:stats scope
        given()
            .when().get("/api/admin/activity")
            .then()
            .statusCode(200);
    }
}
