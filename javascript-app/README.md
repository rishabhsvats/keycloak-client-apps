# JavaScript App with Keycloak

Vanilla HTML/JavaScript application integrated with Keycloak using **keycloak-js**. Calls the Node.js backend for both **public** and **secured** endpoints.

## Keycloak setup

- Create a **client** for this app:
  - Client ID: `javascript-app`
  - Client authentication: **OFF** (public)
  - Access type: **public**
  - Valid redirect URIs: `http://localhost:5174/*`
  - Web origins: `http://localhost:5174`

## Run

1. Start the Node.js backend (`nodejs-backend`) on port 3001.
2. From this folder:

```bash
npm install
npm run dev
```

App runs at `http://localhost:5174`. Vite proxies `/api` to the Node.js backend.

## Configuration

Keycloak URL, realm, and client ID are in `src/keycloak.js`. Change them to match your Keycloak instance.

## Features

- **Public**: Buttons to call `GET /api/public/health` and `GET /api/public/info` (no login).
- **Secured**: After login, call `GET /api/secured/me` and `GET /api/secured/data` with Bearer token.
- Login / Logout via Keycloak.
