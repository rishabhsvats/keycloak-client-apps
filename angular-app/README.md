# Angular App with Keycloak

Angular app integrated with Keycloak. Calls the Node.js backend for both **public** and **secured** endpoints. The Bearer token is added automatically to requests to `/api/secured/*`.

## Keycloak setup

- Create a **client** for this app:
  - Client ID: `angular-app`
  - Client authentication: **OFF** (public)
  - Access type: **public**
  - Valid redirect URIs: `http://localhost:4200/*`
  - Web origins: `http://localhost:4200`

## Run

1. Start the Node.js backend (`nodejs-backend`) on port 3001.
2. From this folder:

```bash
npm install
npx ng serve
```

App runs at `http://localhost:4200`. The dev server proxies `/api` to the Node.js backend.

## Configuration

Keycloak URL, realm, and client ID are in `src/app/app.config.ts`. Change them or use environment files if you need different values per environment.

## Features

- **Public**: Page that calls `GET /api/public/health` and `GET /api/public/info` (no login).
- **Secured**: Page that calls `GET /api/secured/me` and `GET /api/secured/data` with Bearer token (login required).
- Login / Logout via Keycloak.
- `keycloak-angular` adds the Bearer token only to requests matching `/api/secured`.
