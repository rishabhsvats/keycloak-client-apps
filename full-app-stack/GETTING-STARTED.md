# Getting Started - Task Management Teaching App

## Quick Setup (5 minutes)

### 1. Start Services

```bash
# Start Keycloak, PostgreSQL, MailHog
docker-compose up -d

# Wait 30 seconds, check logs
docker-compose logs -f keycloak
# Look for: "Keycloak 26.0.6 started"
# Press Ctrl+C
```

### 2. Configure Keycloak

```bash
# Add protocol mappers, assign client scopes, and set user attributes
./setup.sh
```

**What it does:**
- ✅ Enables unmanaged attributes (you may need to do this manually in Keycloak UI)
- ✅ Adds protocol mappers to client scopes
- ✅ Assigns client scopes to clients (task-frontend-app, admin-dashboard-frontend)
- ✅ Creates test users with roles (admin, manager, developer, viewer)
- ✅ Sets custom attributes on test users (department, jobTitle, team, etc.)

**Note:** If the script asks you to enable unmanaged attributes manually:
1. Go to http://localhost:8180/admin/master/console/#/taskmanager/realm-settings
2. Click "User Profile" tab
3. Change "Unmanaged attributes" to "Enabled"
4. Click "Save"
5. Return to terminal and press Enter

### 3. Start Backend

```bash
cd backend
./mvnw quarkus:dev
```

### 4. Start Frontends

```bash
# Terminal 2
cd task-frontend
npm install && npm run dev

# Terminal 3  
cd admin-dashboard
npm install && npm run dev
```

## Test It Works

### Login
- **Task Manager:** http://localhost:5173
- **Admin Dashboard:** http://localhost:5174

### Test Users
- `admin@taskmanager.com` / `admin123` - Full access
- `manager@taskmanager.com` / `manager123` - Can create projects
- `dev@taskmanager.com` / `dev123` - Can update tasks
- `viewer@taskmanager.com` / `viewer123` - Read-only

### Check Protocol Mappers

**Option 1: View in UI**
- Login to Task Manager as `manager@taskmanager.com`
- Look at the dashboard - you'll see a "Token Claims (Protocol Mappers)" card
- Click "🔍 Debug: View Raw JWT Token" to see the full token

**Option 2: Browser Console**
```javascript
const token = keycloak.tokenParsed;
console.log("Department:", token.department);      // "Engineering"
console.log("Job Title:", token.job_title);        // "Senior Project Manager"
console.log("Team:", token.team);                  // "Platform Team"
```

**Compare tokens:**
- Task Manager token has: department, job_title, team (from task:write, task:assign scopes)
- Admin Dashboard token has: admin_level, access_level (from admin:users, admin:stats scopes)
- Both have: name, email (from shared task:read scope)

## Teaching Scenarios

### 1. SSO Demo
1. Login to Task Manager as admin
2. Click "Admin Dashboard" link
3. **No re-login required!** ← Single Sign-On

### 2. Scope Restrictions
1. Login to Admin Dashboard as admin
2. Try to create a task ← **No button!**
3. **Why:** Admin Dashboard lacks `task:write` scope
4. Login to Task Manager ← **Can create tasks**

### 3. Protocol Mappers
1. Login to both apps with same user
2. Compare tokens in DevTools
3. **Different claims based on client scopes!**

## What's Inside

- **Keycloak:** http://localhost:8180 (admin / admin)
- **Backend API:** http://localhost:8080
- **MailHog:** http://localhost:8025 (fake email server)
- **PostgreSQL:** localhost:5432

## Full Documentation

- **CONTEXT.md** - Architecture and technical details
- **TEACHING-GUIDE.md** - Step-by-step Keycloak concepts  
- **README.md** - Complete reference

## Troubleshooting

**Keycloak not starting?**
```bash
docker-compose down
docker-compose up -d
```

**Setup script fails?**
```bash
# Wait longer for Keycloak
sleep 30
./setup.sh
```

**Claims not in token?**
```bash
# Logout and login again to get fresh token
```

**Port conflicts?**
```bash
# Check what's using ports
sudo lsof -i :8180  # Keycloak
sudo lsof -i :8080  # Backend
sudo lsof -i :5173  # Task Frontend
sudo lsof -i :5174  # Admin Dashboard
```
