# Node.js Backend with Keycloak

Express backend with Keycloak bearer-token protection. Exposes both **public** and **secured** endpoints.

## Setup

### 1. Keycloak

- Create a **realm** (or use `master`).
- Create a **client**:
  - Client ID: `nodejs-backend`
  - Client authentication: **ON**
  - Authorization: Off
  - Access type: **bearer-only** (or confidential with bearer-only enabled)
- No redirect URIs needed for bearer-only.

### 2. Install and run

```bash
npm install
npm run dev
```

Server runs at `http://localhost:3001`.

### 3. Environment (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `KEYCLOAK_URL` | http://localhost:8080/ | Keycloak server URL |
| `KEYCLOAK_REALM` | master | Realm name |
| `KEYCLOAK_CLIENT_ID` | nodejs-backend | Client ID |
| `SESSION_SECRET` | (dev default) | Session secret |

## Endpoints

| Path | Auth | Description |
|------|------|-------------|
| `GET /api/public/health` | No | Health check |
| `GET /api/public/info` | No | Public info |
| `GET /api/secured/me` | Bearer | Current user from token |
| `GET /api/secured/data` | Bearer | Sample protected data |
| `GET /api/secured/token` | Bearer | Returns full token (raw + decoded payload) and prints it to server log |
| `GET /api/secured/admin` | Bearer + realm role `admin` | Admin-only |

## Testing secured endpoints

```bash
# Get a token (replace with your Keycloak URL, realm, client, user, password)
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -d "client_id=YOUR_PUBLIC_CLIENT" \
  -d "username=user" \
  -d "password=pass" \
  -d "grant_type=password" | jq -r .access_token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/secured/me
```
