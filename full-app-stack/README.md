# Task Management System - Keycloak Reference Implementation

A comprehensive reference implementation demonstrating **Keycloak authentication and authorization** patterns and best practices. This system showcases Single Sign-On (SSO), OAuth2/OIDC flows, role-based access control (RBAC), client scope-based permissions, and protocol mappers.

**🚀 Want to get started quickly? See [GETTING-STARTED.md](GETTING-STARTED.md)**

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Concepts Demonstrated](#key-concepts-demonstrated)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Access URLs](#access-urls)
- [Test Users](#test-users)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Teaching Scenarios](#teaching-scenarios)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Keycloak (Port 8180)                    │
│  Realm: taskmanager                                             │
│  - 3 Clients (backend API, task frontend, admin dashboard)      │
│  - 4 Roles (admin, project-manager, developer, viewer)          │
│  - 5 Custom Scopes (task:read/write/assign, admin:users/stats)  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
         ┌──────────▼─────────┐     │     ┌────────▼──────────┐
         │  Task Frontend     │     │     │ Admin Dashboard   │
         │  (Port 5173)       │     │     │ (Port 5174)       │
         │  Public Client     │     │     │ Public Client     │
         │  PKCE Flow         │     │     │ PKCE Flow         │
         │                    │     │     │                   │
         │  Scopes:           │     │     │ Scopes:           │
         │  - task:read       │     │     │ - task:read       │
         │  - task:write      │     │     │ - admin:users     │
         │  - task:assign     │     │     │ - admin:stats     │
         └────────────────────┘     │     └───────────────────┘
                    │               │               │
                    └───────────────▼───────────────┘
                            ┌───────────────┐
                            │  Backend API  │
                            │  (Port 8080)  │
                            │  Quarkus      │
                            │  Confidential │
                            │  Client       │
                            └───────┬───────┘
                                    │
                            ┌───────▼───────┐
                            │  PostgreSQL   │
                            │  (Port 5432)  │
                            └───────────────┘

┌─────────────────────┐
│     MailHog         │
│  SMTP: 1025         │
│  Web UI: 8025       │
└─────────────────────┘
```

## Key Concepts Demonstrated

### 1. OAuth2/OIDC Flows
- **Authorization Code Flow + PKCE** for public clients (frontends)
- **Confidential client** authentication for backend API
- **Token refresh** mechanism with automatic refresh before expiration
- **Token expiration** visualization with countdown widget

### 2. Authentication
- **Login-required** flow with redirect to Keycloak
- **Logout** with proper session termination
- **Single Sign-On (SSO)** between Task Manager and Admin Dashboard
- **User registration** with email verification
- **Password reset** flow via email

### 3. Authorization - Dual Model (Roles + Scopes)

**Roles** define WHO the user is:
- `admin` - Full system access
- `project-manager` - Can create/manage projects
- `developer` - Can update assigned tasks
- `viewer` - Read-only access

**Scopes** define WHAT the client can do:
- `task:read` - View projects and tasks
- `task:write` - Create/update/delete projects and tasks
- `task:assign` - Assign tasks to users
- `admin:users` - View user management
- `admin:stats` - View system statistics

**Defense in Depth:**
- Task Frontend can modify tasks (has `task:write` scope)
- Admin Dashboard CANNOT modify tasks (lacks `task:write` scope)
- Even an admin user cannot modify tasks from Admin Dashboard!

### 4. Protocol Mappers

**Protocol mappers** transform user data into JWT token claims. Each client scope has its own protocol mappers, demonstrating scope-based information disclosure.

**Our Protocol Mapper Strategy:**

| Scope | Protocol Mappers | Claims Added | Purpose |
|-------|-----------------|--------------|---------|
| `task:read` | full-name, email, username | `name`, `email`, `preferred_username` | Basic identity |
| `task:write` | department, job-title, created-timestamp | `department`, `job_title`, `account_created_at` | Professional context |
| `task:assign` | team, manager, groups | `team`, `manager_email`, `groups` | Organizational structure |
| `admin:users` | admin-level, admin-permissions, realm-roles | `admin_level`, `admin_permissions`, `realm_access.roles` | Admin metadata |
| `admin:stats` | audience, access-level, token-purpose | `aud`, `access_level`, `token_purpose` | System claims |

**Token Differences Example:**

Task Frontend token (has `task:read`, `task:write`, `task:assign`):
```json
{
  "scope": "task:read task:write task:assign",
  "name": "Project Manager",
  "email": "manager@taskmanager.com",
  "department": "Engineering",
  "job_title": "Senior Project Manager",
  "team": "Platform Team"
}
```

Admin Dashboard token (has `task:read`, `admin:users`, `admin:stats`):
```json
{
  "scope": "task:read admin:users admin:stats",
  "name": "Admin User",
  "email": "admin@taskmanager.com",
  "admin_level": "Super Admin",
  "aud": ["account", "admin-api"],
  "access_level": "full"
}
```

**Key Insight:** Same user receives different token claims based on client scopes and their protocol mappers, enabling fine-grained information disclosure control.

### 5. Permission Examples

| Action | Role Required | Scope Required | Frontend |
|--------|---------------|----------------|----------|
| View projects | Any | `task:read` | Both |
| Create project | Admin OR Project Manager | `task:write` | Task App |
| Update task status | Developer (if assignee) OR Admin/PM | `task:write` OR `task:read` | Task App |
| Assign task | Admin OR Project Manager | `task:assign` | Task App |
| View users | Admin | `admin:users` | Admin Dashboard |
| View statistics | Admin | `admin:stats` | Admin Dashboard |

## Prerequisites

- **Docker** and **Docker Compose**
- **Java 17 or 21** (for backend)
- **Maven 3.9+** (for backend)
- **Node.js 18 or 20** (for frontends)
- **npm 9+** (for frontends)

## Quick Start

### 1. Start Infrastructure

```bash
# Start Keycloak, PostgreSQL, and MailHog
docker-compose up -d

# Wait for Keycloak to be fully started (check logs)
docker-compose logs -f keycloak

# Look for: "Keycloak 26.0.6 started"
# Press Ctrl+C to exit logs
```

### 2. Start Backend API

```bash
cd backend
./mvnw quarkus:dev
```

Backend will start on http://localhost:8080

### 3. Start Task Management Frontend

```bash
# In a new terminal
cd task-frontend
npm install
npm run dev
```

Frontend will start on http://localhost:5173

### 4. Start Admin Dashboard

```bash
# In a new terminal
cd admin-dashboard
npm install
npm run dev
```

Dashboard will start on http://localhost:5174

### 5. Setup Keycloak Configuration (One-Time Setup)

Configure Keycloak with protocol mappers and client scopes:

```bash
# Wait ~30 seconds after docker-compose up, then run:
./setup.sh
```

**What it does:**
- ✅ Enables unmanaged attributes (required for custom user attributes)
- ✅ Creates roles (admin, project-manager, developer, viewer)
- ✅ Creates test users with passwords and roles
- ✅ Adds protocol mappers to client scopes (name, email, department, team, etc.)
- ✅ Assigns client scopes to clients (task:read, task:write, admin:users, etc.)
- ✅ Sets user attributes on test users (department, jobTitle, team)

**To verify:**
```bash
# Login to http://localhost:5173 as manager@taskmanager.com
# Open DevTools Console and run:
console.log(keycloak.tokenParsed.department)  // "Engineering"
console.log(keycloak.tokenParsed.job_title)   // "Senior Project Manager"
console.log(keycloak.tokenParsed.team)        // "Platform Team"
```

## Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Task Manager App** | http://localhost:5173 | See test users below |
| **Admin Dashboard** | http://localhost:5174 | Admin only |
| **Backend API** | http://localhost:8080 | N/A (token required) |
| **Keycloak Admin Console** | http://localhost:8180 | admin / admin |
| **MailHog Web UI** | http://localhost:8025 | None required |
| **PostgreSQL** | localhost:5432 | taskmanager / taskmanager123 |

## Test Users

All users have **verified emails** and can log in immediately:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@taskmanager.com | admin123 | Admin | Full system access, can access both apps |
| manager@taskmanager.com | manager123 | Project Manager | Can create projects and tasks |
| dev@taskmanager.com | dev123 | Developer | Can update assigned task status |
| viewer@taskmanager.com | viewer123 | Viewer | Read-only access |

## Project Structure

```
full-app/
├── docker-compose.yml              # Infrastructure orchestration
├── keycloak/
│   └── realm-export.json          # Pre-configured Keycloak realm
├── backend/                        # Quarkus REST API
│   ├── src/main/java/com/taskmanager/
│   │   ├── entity/                # JPA entities (Project, Task)
│   │   ├── repository/            # Panache repositories
│   │   ├── service/               # Business logic
│   │   ├── resource/              # REST endpoints
│   │   └── security/              # @RequiresScope annotation
│   └── src/main/resources/
│       ├── application.properties # Configuration
│       └── import.sql             # Sample data
├── task-frontend/                 # React SPA (Task Manager)
│   └── src/
│       ├── auth/                  # Keycloak integration
│       ├── services/              # API client
│       ├── components/            # Reusable components
│       └── pages/                 # Page components
└── admin-dashboard/               # React SPA (Admin)
    └── src/
        ├── auth/                  # Keycloak integration
        ├── services/              # API client
        ├── components/            # Reusable components
        └── pages/                 # Page components
```

## Technology Stack

### Infrastructure
- **Keycloak 26.0.6** - Authentication & Authorization
- **PostgreSQL 16** - Database
- **MailHog** - Email testing (SMTP server)

### Backend
- **Quarkus 3.8.6** - Java framework
- **Hibernate ORM with Panache** - Database access
- **Quarkus OIDC** - Token validation
- **JAX-RS** - REST endpoints

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling
- **keycloak-js 26.0.6** - Keycloak adapter
- **react-router-dom** - Routing
- **react-hot-toast** - Notifications

## Usage Examples

### Example 1: SSO Demonstration

1. Open Task Manager (http://localhost:5173)
2. Log in as `admin@taskmanager.com` / `admin123`
3. Notice the token expiration countdown
4. Click "Admin Dashboard" link in header
5. **Observe:** No login required - you're already authenticated!
6. Check the scopes in both apps - they're different

### Example 2: Scope-Based Authorization

1. Log in to Admin Dashboard as admin
2. View system statistics (has `admin:stats` scope)
3. Click "Task Manager" link
4. Try to create a project
5. Go back to Admin Dashboard
6. **Observe:** Admin Dashboard has no "create" buttons
7. **Why:** Admin Dashboard lacks `task:write` scope

### Example 3: Role-Based Permissions

1. Log in to Task Manager as `dev@taskmanager.com`
2. **Notice:** No "Create Project" button (lacks admin/project-manager role)
3. Click on a project
4. **Notice:** Can update status of assigned tasks only
5. Log out and log in as `manager@taskmanager.com`
6. **Notice:** Can create projects and manage all tasks

### Example 4: Token Refresh

1. Log in to Task Manager
2. Watch the token expiration countdown
3. Wait (token expires in 5 minutes by default)
4. Make an action (navigate, create project)
5. **Notice:** "Token refreshed" notification appears
6. Token countdown resets to 5 minutes

### Example 5: Protocol Mappers & Token Claims

**Prerequisites:** Run `./setup.sh` to configure protocol mappers and user attributes

1. Log in to Task Manager as `manager@taskmanager.com` / `manager123`
2. Open browser DevTools → Console
3. Inspect the token claims:
   ```javascript
   const token = keycloak.tokenParsed;
   console.log("Basic identity (task:read):", {
     name: token.name,
     email: token.email,
     username: token.preferred_username
   });
   
   console.log("Professional context (task:write):", {
     department: token.department,
     jobTitle: token.job_title
   });
   
   console.log("Org structure (task:assign):", {
     team: token.team,
     manager: token.manager_email
   });
   ```
4. **Notice:** Different scopes add different claims via protocol mappers
5. Log in to Admin Dashboard as `admin@taskmanager.com`
6. Inspect token - different claims (admin_level, access_level, etc.)
7. **Key insight:** Same user receives different information based on client scopes

### Example 6: User Registration & Email Verification

1. Go to Task Manager login page
2. Click "Register" (on Keycloak page)
3. Fill in registration form
4. Open MailHog (http://localhost:8025)
5. **Notice:** Verification email received
6. Click verification link
7. Log in with new credentials

## Troubleshooting

### Keycloak shows "Invalid redirect_uri"

**Solution:** Check that frontend URLs in `.env` files match the Keycloak client redirect URIs:
- Task Frontend: http://localhost:5173/*
- Admin Dashboard: http://localhost:5174/*

### Backend returns 401 Unauthorized

**Cause:** Token validation failed

**Solutions:**
- Check Keycloak is running: `docker-compose ps`
- Verify backend `application.properties` points to correct Keycloak URL
- Check token hasn't expired (look at token countdown)
- Try logging out and back in

### Backend returns 403 Forbidden

**Cause:** User lacks required role or client lacks required scope

**Solutions:**
- Check user has the required role in Keycloak Admin Console
- Verify the client has the required scope assigned
- Check backend logs for detailed permission error
- Review `@RequiresScope` and `@RolesAllowed` annotations

### Cannot create project/task from Admin Dashboard

**This is expected!** Admin Dashboard lacks `task:write` and `task:assign` scopes. This demonstrates scope-based authorization. Use the Task Manager app to modify tasks.

### MailHog not receiving emails

**Solutions:**
- Check MailHog is running: `docker-compose ps`
- Verify Keycloak SMTP settings point to `mailhog:1025`
- Check MailHog logs: `docker-compose logs mailhog`

### Port already in use

**Solutions:**
- Check if services are already running: `lsof -i :8180`, `lsof -i :5173`, etc.
- Stop conflicting services or change ports in configuration files
- For Keycloak: Edit `docker-compose.yml` port mapping
- For frontends: Edit `vite.config.ts` server port

## Next Steps

1. **Review the code** - Examine how `@RequiresScope` interceptor works
2. **Read GUIDE.md** - Detailed walkthrough of Keycloak concepts and implementation patterns
3. **Explore Keycloak Admin Console** - See realm configuration and customization options
4. **Test different users** - Experience different permission levels and flows
5. **Check backend tests** - See how token validation is tested
6. **Modify scopes** - Experiment with changing client scopes in Keycloak
7. **Extend the implementation** - Add new roles, scopes, or protocol mappers for your use case

## Learn More

- **GUIDE.md** - Comprehensive guide to Keycloak concepts with code references
- **CONTEXT.md** - Architectural decisions and implementation details
- **Keycloak Documentation** - https://www.keycloak.org/documentation

## Support

For questions or issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs (backend, frontend console, Docker logs)
3. Consult Keycloak documentation

## License

MIT License - Feel free to use this as a reference for your own projects.
