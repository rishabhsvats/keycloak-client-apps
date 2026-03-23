# Quarkus Backend with Keycloak

Quarkus REST backend secured with Keycloak OIDC Bearer token authentication. Exposes both **public** and **secured** endpoints.

## Setup

### 1. Keycloak

- Create a **client** (or use the same realm as other apps):
  - Client ID: `quarkus-backend`
  - Client authentication: **ON** (optional for bearer-only)
  - Access type: **bearer-only** (or confidential with only service accounts / no direct login)
- No redirect URIs needed for bearer-only.

### 2. Build and run

```bash
./mvn quarkus:dev
```

Server runs at `http://localhost:8081`.

### 3. Environment (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `KEYCLOAK_URL` | http://localhost:8080/realms/master | Keycloak realm URL (must include `/realms/<realm>`) |
| `KEYCLOAK_CLIENT_ID` | quarkus-backend | Client ID |

## Endpoints

| Path | Auth | Description |
|------|------|-------------|
| `GET /api/public/health` | No | Health check |
| `GET /api/public/info` | No | Public info |
| `GET /api/secured/token` | Bearer | Returns the **complete token** (raw JWT + decoded payload) and prints it to the server log |
| `GET /api/secured/me` | Bearer | Current user from token |
| `GET /api/secured/data` | Bearer | Sample protected data |
| `GET /api/secured/admin` | Bearer + realm role `admin` | Admin-only |

## Testing secured endpoints

Obtain a token from Keycloak (e.g. using a public client and resource owner password grant), then:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/secured/me
```
