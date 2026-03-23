# Keycloak sample applications

This repository contains sample applications that integrate with **Keycloak** for authentication and authorization. Use them to test Keycloak with different runtimes and frontends.

## Applications

| Application           | Type     | Port | Description |
|-----------------------|----------|------|-------------|
| **nodejs-backend**    | Backend  | 3001 | Express + Keycloak bearer-only; public and secured REST endpoints |
| **spring-boot-backend** | Backend | 8082 | Spring Boot 3 + OAuth2 resource server (JWT); public and secured REST endpoints |
| **quarkus-backend**   | Backend  | 8081 | Quarkus + OIDC bearer (service); public and secured REST endpoints |
| **quarkus-webapp-backend** | Backend | 8083 | Quarkus + OIDC web-app (authorization code); BFF for Angular/React/JS; session cookie |
| **react-app**         | Frontend | 5173 | React (Vite) + keycloak-js; calls Node.js backend |
| **angular-app**       | Frontend | 4200 | Angular + keycloak-angular; calls Node.js backend |
| **javascript-app**    | Frontend | 5174 | Vanilla JavaScript + keycloak-js; calls Node.js backend |

## Keycloak setup

Use a single realm (e.g. `master` or a new realm). Create the following **clients** in the Keycloak Admin Console.

### 1. Backend clients (bearer-only / service)

- **nodejs-backend**
  - Client ID: `nodejs-backend`
  - Client authentication: **ON**
  - Access type: **bearer-only** (or confidential, no direct access)
  - No redirect URIs

- **quarkus-backend**
  - Client ID: `quarkus-backend`
  - Client authentication: **ON** (optional for bearer-only)
  - Access type: **bearer-only**
  - No redirect URIs

- **spring-boot-backend**
  - Use any client ID (e.g. `spring-boot-backend`); the app validates tokens via the realm’s JWKS (issuer-uri). Create a bearer-only or confidential client if you want a dedicated backend client in Keycloak.

- **quarkus-webapp-backend** (BFF for Angular/React/JS with OIDC web-app)
  - Client ID: `quarkus-webapp`
  - Client authentication: **ON**
  - Valid redirect URIs: `http://localhost:8083/api/auth/callback`, `http://localhost:8083/*`
  - Web origins: `http://localhost:8083`, `http://localhost:4200`, `http://localhost:5173`, `http://localhost:5174`
  - Create a **client secret** and set `KEYCLOAK_CLIENT_SECRET` (or `quarkus.oidc.credentials.secret`) when running.

### 2. Frontend clients (public)

- **react-app**
  - Client ID: `react-app`
  - Client authentication: **OFF**
  - Valid redirect URIs: `http://localhost:5173/*`
  - Web origins: `http://localhost:5173`

- **angular-app**
  - Client ID: `angular-app`
  - Client authentication: **OFF**
  - Valid redirect URIs: `http://localhost:4200/*`
  - Web origins: `http://localhost:4200`

- **javascript-app**
  - Client ID: `javascript-app`
  - Client authentication: **OFF**
  - Valid redirect URIs: `http://localhost:5174/*`
  - Web origins: `http://localhost:5174`

### 3. Users and roles

Create at least one user (e.g. username/password) in the realm. Optionally assign the **admin** realm role to test role-protected endpoints (`/api/secured/admin` on Node and Quarkus).

## Running the stack

1. **Start Keycloak** (e.g. on port 8080).

2. **Start a backend** (pick one or more):
   - Node.js: `cd nodejs-backend && npm install && npm run dev`
   - Spring Boot: `cd spring-boot-backend && ./mvnw spring-boot:run`
   - Quarkus (bearer): `cd quarkus-backend && ./mvnw quarkus:dev`
   - Quarkus (web-app BFF): `cd quarkus-webapp-backend && ./mvnw quarkus:dev` (set `KEYCLOAK_CLIENT_SECRET`)

3. **Start a frontend** (React, Angular, and JavaScript app use the Node.js backend by default via proxy; to use the Quarkus web-app backend instead, point their API base to `http://localhost:8083` and use redirect-based login; see `quarkus-webapp-backend/README.md`):
   - React: `cd react-app && npm install && npm run dev`
   - Angular: `cd angular-app && npm install && ng serve`
   - JavaScript: `cd javascript-app && npm install && npm run dev`

4. Open the frontend in the browser, log in with Keycloak, and use **Public** vs **Secured** pages to call unsecured and secured backend endpoints.

## Endpoints overview

- **Public (no auth):** `GET /api/public/health`, `GET /api/public/info`
- **Secured:** `GET /api/secured/me`, `GET /api/secured/data` (Bearer token for Node/Spring/Quarkus bearer backends; session cookie for Quarkus web-app backend)
- **Admin (Bearer + role or session + role):** `GET /api/secured/admin` (realm role `admin`)

The **quarkus-webapp-backend** also exposes `GET /api/auth/login` (redirect to Keycloak) and `GET /api/auth/logout`.

Each app’s README has detailed setup and environment options.
