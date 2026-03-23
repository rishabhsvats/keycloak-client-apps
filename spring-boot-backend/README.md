# Spring Boot Backend with Keycloak

Spring Boot 3 REST API secured with Keycloak as an **OAuth2 resource server** (JWT validation via JWKS). Exposes both **public** and **secured** endpoints.

## Setup

### 1. Keycloak

- Create a **client** for this backend (bearer-only / resource server):
  - Client ID: `spring-boot-backend` (or any ID; validation is by issuer, not client ID)
  - Client authentication: **ON**
  - Access type: **bearer-only** (or confidential)
  - No redirect URIs needed

The app validates tokens using the realm’s JWKS endpoint; the client ID in Keycloak is only for identifying the client that might use the API, not for token validation.

### 2. Build and run

```bash
./mvnw spring-boot:run
```

Server runs at `http://localhost:8082`.

### 3. Environment (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | 8082 | Server port |
| `KEYCLOAK_ISSUER_URI` | http://localhost:8080/realms/master | Keycloak realm issuer URI (must match token `iss` claim) |

## Endpoints

| Path | Auth | Description |
|------|------|-------------|
| `GET /api/public/health` | No | Health check |
| `GET /api/public/info` | No | Public info |
| `GET /api/secured/me` | Bearer | Current user from token |
| `GET /api/secured/data` | Bearer | Sample protected data |
| `GET /api/secured/admin` | Bearer + realm role `admin` | Admin-only |

## Testing secured endpoints

Obtain an access token from Keycloak (e.g. with a public client and resource owner password grant), then:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8082/api/secured/me
```
