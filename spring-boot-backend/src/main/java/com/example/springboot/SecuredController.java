package com.example.springboot;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/secured")
public class SecuredController {

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal Jwt jwt) {
        String user = jwt.getClaimAsString("preferred_username");
        if (user == null) {
            user = jwt.getSubject();
        }
        if (user == null) {
            user = "authenticated";
        }
        return ResponseEntity.ok(Map.of(
                "message", "Secured endpoint - you are authenticated",
                "user", user
        ));
    }

    @GetMapping("/data")
    public ResponseEntity<Map<String, Object>> data() {
        return ResponseEntity.ok(Map.of(
                "message", "Protected data",
                "items", List.of(
                        Map.of("id", 1, "name", "Item A", "type", "secured"),
                        Map.of("id", 2, "name", "Item B", "type", "secured")
                )
        ));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<Map<String, Object>> admin() {
        return ResponseEntity.ok(Map.of(
                "message", "Admin-only endpoint",
                "note", "Only users with realm role 'admin' can access this."
        ));
    }
}
