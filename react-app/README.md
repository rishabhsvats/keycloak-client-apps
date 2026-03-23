# React App with Keycloak

React (Vite) app integrated with Keycloak. Calls the Node.js backend for both **public** and **secured** endpoints.

## Keycloak setup

- Create a **client** for this app:
  - Client ID: `react-app`
  - Client authentication: **OFF** (public)
  - Access type: **public**
  - Valid redirect URIs: `http://localhost:5173/*`
  - Web origins: `http://localhost:5173` (or `+` to allow all redirect URIs)

## Run

1. Start the Node.js backend (`nodejs-backend`) on port 3001.
2. From this folder:

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`. Vite proxies `/api` to the Node.js backend.

## Environment

Copy `.env.example` to `.env` and adjust if needed:

- `VITE_KEYCLOAK_URL` – Keycloak server (default `http://localhost:8080`)
- `VITE_KEYCLOAK_REALM` – Realm (default `master`)
- `VITE_KEYCLOAK_CLIENT_ID` – Client ID (default `react-app`)
- `VITE_API_URL` – Leave empty when using Vite proxy; set to `http://localhost:3001` if backend is elsewhere

## Features

- **Public**: Page that calls `GET /api/public/health` and `GET /api/public/info` (no login).
- **Secured**: Page that calls `GET /api/secured/me` and `GET /api/secured/data` with Bearer token (login required).
- Login / Logout via Keycloak.
