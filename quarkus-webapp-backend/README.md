# Quarkus Web App Backend (BFF)

Quarkus backend with **OIDC application-type=web-app** (authorization code flow). Intended as a BFF (Backend for Frontend) for the **Angular**, **React**, and **JavaScript** apps. Authentication is session-based (cookie) after redirect to Keycloak.

## Keycloak setup

Create a **confidential** client:

- **Client ID:** `quarkus-webapp`
- **Client authentication:** ON
- **Valid redirect URIs:** `http://localhost:8083/api/auth/callback` (and add `http://localhost:8083/*` if you use other paths)
- **Web origins:** `http://localhost:8083`, `http://localhost:4200`, `http://localhost:5173`, `http://localhost:5174`
- Create a **client secret** and set it in config (see below).

## Configuration

Set the client secret (required for code exchange):

```properties
# In application.properties or via env
quarkus.oidc.credentials.secret=your-client-secret
# Or
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

Optional env vars:

| Variable | Default | Description |
|----------|---------|-------------|
| `KEYCLOAK_URL` | http://localhost:8080/realms/master | Keycloak realm URL |
| `KEYCLOAK_CLIENT_ID` | quarkus-webapp | Client ID |
| `KEYCLOAK_CLIENT_SECRET` | (none) | **Required** – client secret |

## Run

```bash
./mvnw quarkus:dev
```

Server: **http://localhost:8083**

## Endpoints

| Path | Auth | Description |
|------|------|-------------|
| `GET /api/public/health` | No | Health check |
| `GET /api/public/info` | No | Public info |
| `GET /api/auth/login` | Triggers redirect | Start login: open in browser → redirects to Keycloak, then back with session |
| `GET /api/auth/callback` | (OIDC) | Keycloak redirect target; do not call directly |
| `GET /api/auth/logout` | Session | Logout (extend to redirect to Keycloak end-session if needed) |
| `GET /api/secured/me` | Session | Current user |
| `GET /api/secured/data` | Session | Protected data |
| `GET /api/secured/admin` | Session + role `admin` | Admin only |

## Using with the frontends (Angular / React / JavaScript)

1. **Point API base to this backend**  
   Configure each frontend to call `http://localhost:8083` (proxy or `VITE_API_URL` / Angular env).

2. **Login (redirect-based)**  
   Instead of using Keycloak in the frontend, send the user to the BFF login URL so the session cookie is set on the Quarkus host:
   - **Login:** open in browser (or set `window.location`) to  
     `http://localhost:8083/api/auth/login`  
   - User is redirected to Keycloak, then back to Quarkus with a session cookie.

3. **API calls with cookie**  
   From the same browser, call Quarkus APIs **with credentials** so the session cookie is sent:
   - `fetch('http://localhost:8083/api/secured/me', { credentials: 'include' })`
   - Or use a dev proxy so the app origin is `http://localhost:8083` and requests are same-origin (cookie sent automatically).

4. **CORS**  
   Quarkus is configured to allow origins `http://localhost:4200`, `http://localhost:5173`, `http://localhost:5174` with credentials. If you use other origins, add them to `quarkus.http.cors.origins`.

## Optional: proxy frontends through Quarkus

To avoid cross-origin and cookie issues, you can serve the built Angular/React/JS apps from Quarkus (e.g. from `src/main/resources/META-INF/resources`) and access the app at `http://localhost:8083`. Then login and API calls are same-origin and the session cookie works without CORS.
