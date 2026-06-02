# Keycloak Implementation Guide

This guide provides a comprehensive walkthrough of Keycloak authentication and authorization patterns using the Task Management System as a reference implementation. Each section includes conceptual explanations, Keycloak Admin UI navigation, code references, and practical demonstrations.

## Table of Contents

1. [Public vs Confidential Clients](#1-public-vs-confidential-clients)
2. [Authorization Code Flow + PKCE](#2-authorization-code-flow--pkce)
3. [Client Scopes](#3-client-scopes)
4. [Protocol Mappers](#4-protocol-mappers)
5. [Role-Based Access Control](#5-role-based-access-control)
6. [Token Validation](#6-token-validation)
7. [Token Refresh Flow](#7-token-refresh-flow)
8. [SSO Between Applications](#8-sso-between-applications)
9. [User Workflows](#9-user-workflows)

---

## 1. Public vs Confidential Clients

### What it is

**Confidential Clients:**
- Can securely store client secrets
- Typically backend services (APIs, server-side apps)
- Authenticate with client ID + client secret
- Example: `task-backend-api`

**Public Clients:**
- Cannot securely store secrets (e.g., browser-based apps, mobile apps)
- Client secret would be exposed in browser DevTools or app decompilation
- Must use PKCE for security
- Examples: `task-frontend-app`, `admin-dashboard-frontend`

### Where to see it in Keycloak Admin UI

1. Navigate to **Keycloak Admin Console**: http://localhost:8180
2. Login with `admin` / `admin`
3. Select **taskmanager** realm (dropdown in top-left)
4. Click **Clients** in left menu
5. Click **task-backend-api**:
   - **Client authentication**: ON (confidential)
   - **Client Authenticator**: Client Id and Secret
   - View the **Credentials** tab to see the client secret
6. Click **task-frontend-app**:
   - **Client authentication**: OFF (public)
   - No **Credentials** tab (no secret)

### Where it's implemented in code

**Backend (Confidential Client):**
```
File: backend/src/main/resources/application.properties
Lines: 15-17

quarkus.oidc.auth-server-url=http://localhost:8180/realms/taskmanager
quarkus.oidc.client-id=task-backend-api
quarkus.oidc.credentials.secret=backend-secret-key-change-in-production
```

**Frontend (Public Client):**
```
File: task-frontend/src/auth/keycloak.ts
Lines: 3-7

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});
// Note: No client secret!
```

### How to demonstrate it

1. **Backend uses client secret:**
   - Open `backend/src/main/resources/application.properties`
   - Show the `quarkus.oidc.credentials.secret` property
   - Explain: Backend can store this securely on the server

2. **Frontend has no secret:**
   - Open `task-frontend/src/auth/keycloak.ts`
   - Show the Keycloak initialization - no secret parameter
   - Open browser DevTools → Sources → view the compiled JS
   - Explain: Any secret here would be visible to users

3. **Try changing backend secret in Keycloak:**
   - In Keycloak Admin, go to Clients → task-backend-api → Credentials
   - Click "Regenerate" on Client Secret
   - Restart backend (still using old secret)
   - Backend will fail to authenticate
   - Change `application.properties` to new secret
   - Backend works again

---

## 2. Authorization Code Flow + PKCE

### What it is

**Authorization Code Flow:**
1. User clicks login
2. Browser redirects to Keycloak login page
3. User authenticates
4. Keycloak redirects back with authorization code
5. App exchanges code for access token

**PKCE (Proof Key for Code Exchange):**
- Adds extra security for public clients
- Prevents authorization code interception attacks
- Uses code_verifier and code_challenge
- Method: S256 (SHA-256 hash)

### Where to see it in Keycloak Admin UI

1. **Keycloak Admin Console** → **Clients** → **task-frontend-app**
2. **Settings** tab:
   - **Standard Flow Enabled**: ON (Authorization Code Flow)
   - **Direct Access Grants Enabled**: OFF (no password flow)
   - **Implicit Flow Enabled**: OFF (deprecated)
3. **Advanced** tab → **Advanced Settings**:
   - **Proof Key for Code Exchange Code Challenge Method**: S256

### Where it's implemented in code

**Frontend Keycloak Initialization:**
```
File: task-frontend/src/auth/keycloak.ts
Lines: 12-25

export const initKeycloak = (onAuthenticatedCallback: () => void) => {
  keycloak
    .init({
      onLoad: 'login-required',  // Redirect to login immediately
      pkceMethod: 'S256',         // PKCE with SHA-256
      checkLoginIframe: false,
    })
    .then((authenticated) => {
      if (authenticated) {
        onAuthenticatedCallback();
      } else {
        keycloak.login();
      }
    });
};
```

### How to demonstrate it

1. **Observe the login flow:**
   - Open Task Manager (http://localhost:5173)
   - Open browser DevTools → Network tab
   - Click login (or page loads)
   - Watch for redirect to Keycloak:
     ```
     http://localhost:8180/realms/taskmanager/protocol/openid-connect/auth
       ?client_id=task-frontend-app
       &redirect_uri=http://localhost:5173/
       &response_type=code
       &code_challenge=<BASE64_STRING>
       &code_challenge_method=S256
     ```
   - Note the `code_challenge` parameter (PKCE)

2. **See the code exchange:**
   - After login, watch for POST to token endpoint:
     ```
     POST http://localhost:8180/realms/taskmanager/protocol/openid-connect/token
     Body:
       grant_type=authorization_code
       code=<AUTHORIZATION_CODE>
       code_verifier=<ORIGINAL_VERIFIER>
       redirect_uri=http://localhost:5173/
     ```
   - Response contains access_token, refresh_token

3. **Compare with backend (no PKCE):**
   - Backend uses service account (client credentials flow)
   - No authorization code, no PKCE needed
   - Direct token request with client ID + secret

---

## 3. Client Scopes

### What it is

**Client Scopes** define what a client application can do, independent of user roles.

**Why scopes matter:**
- Defense in depth: Even if a user has admin role, the client might not have permission
- Principle of least privilege: Each client gets only the scopes it needs
- Prevents scope creep: Admin Dashboard shouldn't be able to modify tasks

**Our Custom Scopes:**
- `task:read` - View projects and tasks
- `task:write` - Create/update/delete projects and tasks
- `task:assign` - Assign tasks to users
- `admin:users` - View user management
- `admin:stats` - View system statistics

### Where to see it in Keycloak Admin UI

1. **View available scopes:**
   - **Keycloak Admin** → **Client Scopes**
   - See all 5 custom scopes: task:read, task:write, task:assign, admin:users, admin:stats

2. **View client scope assignments:**
   - **Clients** → **task-frontend-app** → **Client scopes** tab
   - **Assigned default client scopes**: task:read, task:write, task:assign
   - **Clients** → **admin-dashboard-frontend** → **Client scopes** tab
   - **Assigned default client scopes**: task:read, admin:users, admin:stats
   - Note: Admin Dashboard has NO task:write or task:assign!

3. **View scope in token:**
   - Login to Task Manager
   - Open DevTools → Application → Session Storage
   - Find the access token (in keycloak object)
   - Copy to https://jwt.io
   - See `"scope": "openid profile email task:read task:write task:assign"`

### Where it's implemented in code

**Backend Scope Validation:**
```
File: backend/src/main/java/com/taskmanager/security/RequiresScope.java
Lines: 11-18

@InterceptorBinding
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface RequiresScope {
    @Nonbinding
    String[] value() default {};
}
```

**Scope Interceptor:**
```
File: backend/src/main/java/com/taskmanager/security/ScopeCheckInterceptor.java
Lines: 26-44

@AroundInvoke
public Object checkScope(InvocationContext context) throws Exception {
    RequiresScope annotation = context.getMethod().getAnnotation(RequiresScope.class);
    
    if (annotation != null && annotation.value().length > 0) {
        String[] requiredScopes = annotation.value();
        Set<String> tokenScopes = extractScopes();  // From JWT "scope" claim
        
        boolean hasRequiredScope = Arrays.stream(requiredScopes)
                .anyMatch(tokenScopes::contains);
        
        if (!hasRequiredScope) {
            throw new UnauthorizedException("Access denied. Required scope(s): ...");
        }
    }
    
    return context.proceed();
}
```

**Endpoint with Scope Check:**
```
File: backend/src/main/java/com/taskmanager/resource/ProjectResource.java
Lines: 30-34

@POST
@RequiresScope("task:write")
@RolesAllowed({"admin", "project-manager"})
public Response createProject(@Valid Project project) {
    // Both scope AND role must be satisfied
}
```

### How to demonstrate it

1. **Task Frontend has task:write scope:**
   - Login to Task Manager as admin
   - Go to Projects page
   - See "Create Project" button (has task:write scope)
   - Create a project successfully

2. **Admin Dashboard lacks task:write scope:**
   - Click "Admin Dashboard" link (SSO, same user)
   - Navigate around - no "Create" or "Edit" buttons
   - Open browser console, try to call API directly:
     ```javascript
     fetch('http://localhost:8080/api/projects', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer ' + keycloak.token
       },
       body: JSON.stringify({name: 'Hacked Project', description: 'Test'})
     })
     ```
   - Response: **403 Forbidden** - "Access denied. Required scope(s): task:write"
   - **Key point:** Even as admin, this client cannot modify tasks due to missing scope!

3. **Compare token scopes:**
   - In Task Manager, open DevTools → Console:
     ```javascript
     keycloak.tokenParsed.scope
     // "openid profile email task:read task:write task:assign"
     ```
   - In Admin Dashboard, open DevTools → Console:
     ```javascript
     keycloak.tokenParsed.scope
     // "openid profile email task:read admin:users admin:stats"
     ```
   - Same user, different scopes!

---

## 4. Protocol Mappers

### What it is

**Protocol Mappers** transform user data, roles, attributes, and other information into claims that are included in JWT tokens. They bridge the gap between Keycloak's internal user model and the claims that applications need.

**Key Concepts:**

- **Mappers attached to Client Scopes:** When a scope is granted, its mappers add claims to the token
- **Different scopes = Different claims:** This allows scope-based information disclosure
- **Multiple mapper types:** User properties, attributes, roles, groups, hardcoded values, audiences

**Our Protocol Mapper Strategy:**

- `task:read` → Basic identity (name, email, username)
- `task:write` → Professional context (department, job title, account age)
- `task:assign` → Organizational structure (team, manager, groups)
- `admin:users` → Admin metadata (admin level, permissions, roles)
- `admin:stats` → System claims (audience, access level, token purpose)

### Where to see it in Keycloak Admin UI

**View Protocol Mappers on a Client Scope:**

1. Navigate to **Keycloak Admin Console**: http://localhost:8180
2. Login with `admin` / `admin`
3. Select **taskmanager** realm
4. Click **Client scopes** in left menu
5. Click **task:read** scope
6. Click **Mappers** tab
7. You'll see three mappers:
   - **full-name-mapper** - Combines first + last name
   - **email-mapper** - Maps email property
   - **username-mapper** - Maps username to preferred_username

**Examine a specific mapper:**

1. Click **full-name-mapper**
2. See configuration:
   - **Mapper Type**: User's full name
   - **Token Claim Name**: (uses standard `name` claim)
   - **Add to ID token**: ON
   - **Add to access token**: ON
   - **Add to userinfo**: ON

**Compare mappers across scopes:**

1. Go to Client scopes → **task:write** → Mappers
   - department-mapper (User Attribute)
   - job-title-mapper (User Attribute)
   - created-timestamp-mapper (User Attribute)

2. Go to Client scopes → **task:assign** → Mappers
   - team-mapper (User Attribute)
   - manager-mapper (User Attribute)
   - groups-mapper (Group Membership)

3. Go to Client scopes → **admin:users** → Mappers
   - admin-level-mapper (User Attribute)
   - admin-permissions-mapper (User Attribute)
   - realm-roles-mapper (Realm Roles)

4. Go to Client scopes → **admin:stats** → Mappers
   - audience-mapper (Audience)
   - access-level-mapper (Hardcoded Claim)
   - token-purpose-mapper (Hardcoded Claim)

### Where it's implemented in code

**Keycloak Configuration:**
```
File: keycloak/realm-export.json
Lines: 153-199 (clientScopes section with protocolMappers)
```

**Backend - Reading mapped claims:**
```java
File: backend/src/main/java/com/taskmanager/resource/UserResource.java

@Context
JsonWebToken jwt;

public UserInfo getCurrentUser() {
    UserInfo info = new UserInfo();
    // KEYCLOAK: Claims from protocol mappers
    info.name = jwt.getClaim("name");              // from task:read
    info.email = jwt.getClaim("email");            // from task:read
    info.department = jwt.getClaim("department");  // from task:write
    info.jobTitle = jwt.getClaim("job_title");     // from task:write
    info.team = jwt.getClaim("team");              // from task:assign
    return info;
}
```

**Frontend - Accessing mapped claims:**
```typescript
File: task-frontend/src/pages/Dashboard.tsx

// Protocol mapper claims available in tokenParsed
const userName = keycloak.tokenParsed?.name;
const email = keycloak.tokenParsed?.email;
const department = keycloak.tokenParsed?.department;
const jobTitle = keycloak.tokenParsed?.job_title;
```

### How to demonstrate it

**Setup: Add custom user attributes**

Before protocol mappers can map custom attributes, we need to set them on users:

1. **Run the setup script:**
   ```bash
   ./setup-user-attributes.sh
   ```
   This adds department, jobTitle, team, manager, and admin attributes to test users.

2. **Or manually via Admin UI:**
   - Go to Users → Select user (e.g., `manager@taskmanager.com`)
   - Click **Attributes** tab
   - Add attributes:
     - `department`: Engineering
     - `jobTitle`: Senior Project Manager
     - `team`: Platform Team
     - `manager`: admin@taskmanager.com
   - Click **Save**

**Demonstration 1: Compare tokens from different clients**

1. **Login to Task Management App** (http://localhost:5173)
   - Login as `manager@taskmanager.com` / `manager123`
   - Open DevTools → Console
   - Inspect token:
     ```javascript
     console.log(JSON.stringify(keycloak.tokenParsed, null, 2))
     ```
   - **Observe claims from multiple scopes:**
     - `name`: "Project Manager" (from task:read)
     - `email`: "manager@taskmanager.com" (from task:read)
     - `preferred_username`: "manager" (from task:read)
     - `department`: "Engineering" (from task:write)
     - `job_title`: "Senior Project Manager" (from task:write)
     - `team`: "Platform Team" (from task:assign)
     - `manager_email`: "admin@taskmanager.com" (from task:assign)

2. **Login to Admin Dashboard** (http://localhost:5174)
   - Login as `admin@taskmanager.com` / `admin123`
   - Open DevTools → Console
   - Inspect token:
     ```javascript
     console.log(JSON.stringify(keycloak.tokenParsed, null, 2))
     ```
   - **Observe different claims:**
     - `name`, `email`, `preferred_username` (from task:read - shared)
     - `admin_level`: "Super Admin" (from admin:users)
     - `admin_permissions`: ["manage_users", "view_stats", ...] (from admin:users)
     - `aud`: [..., "admin-api"] (from admin:stats)
     - `access_level`: "full" (from admin:stats)
     - `token_purpose`: "admin_stats_access" (from admin:stats)
   - **Missing:** department, job_title, team (no task:write or task:assign scopes)

**Demonstration 2: Protocol mapper types**

1. **User Property Mapper** (built-in properties):
   - In Keycloak: Client scopes → task:read → Mappers → email-mapper
   - Maps `email` user property → `email` claim
   - Every user has this property by default

2. **User Attribute Mapper** (custom attributes):
   - In Keycloak: Client scopes → task:write → Mappers → department-mapper
   - Maps custom `department` attribute → `department` claim
   - Only works if attribute is set on user

3. **Full Name Mapper** (computed):
   - In Keycloak: Client scopes → task:read → Mappers → full-name-mapper
   - Combines firstName + lastName → `name` claim
   - Keycloak computes this automatically

4. **Group Membership Mapper**:
   - In Keycloak: Client scopes → task:assign → Mappers → groups-mapper
   - Maps user's Keycloak groups → `groups` array claim
   - Create groups: Groups → Create → "Engineering Team"
   - Assign user: Users → manager@taskmanager.com → Groups → Join "Engineering Team"
   - Token will include: `"groups": ["Engineering Team"]`

5. **Hardcoded Claim Mapper** (static values):
   - In Keycloak: Client scopes → admin:stats → Mappers → access-level-mapper
   - Always adds: `"access_level": "full"`
   - Useful for flagging tokens with specific capabilities

6. **Audience Mapper**:
   - In Keycloak: Client scopes → admin:stats → Mappers → audience-mapper
   - Adds custom audience to `aud` claim
   - Token includes: `"aud": ["account", "admin-api"]`
   - Backend can validate token is intended for admin-api

**Demonstration 3: Scope-driven information disclosure**

1. **Login as manager to Task App:**
   - Token has: name, email, department, job_title, team, manager_email
   - Total claims: ~15-20 (lots of user context)

2. **Login as manager to Admin Dashboard:**
   - Token has: name, email, admin_level, admin_permissions, aud, access_level
   - Missing: department, job_title, team (different scopes!)

3. **Key insight:** Same user, different information based on client scopes
   - Task App doesn't get admin claims (no admin:* scopes)
   - Admin Dashboard doesn't get work claims (no task:write/assign scopes)
   - This is information disclosure control!

**Demonstration 4: Backend usage of mapped claims**

1. **Create a test endpoint to show claims:**

   Add to `UserResource.java`:
   ```java
   @GET
   @Path("/token-info")
   @Produces(MediaType.APPLICATION_JSON)
   public Map<String, Object> getTokenInfo() {
       Map<String, Object> info = new HashMap<>();
       info.put("name", jwt.getClaim("name"));
       info.put("email", jwt.getClaim("email"));
       info.put("department", jwt.getClaim("department"));
       info.put("job_title", jwt.getClaim("job_title"));
       info.put("team", jwt.getClaim("team"));
       info.put("manager_email", jwt.getClaim("manager_email"));
       info.put("admin_level", jwt.getClaim("admin_level"));
       info.put("access_level", jwt.getClaim("access_level"));
       return info;
   }
   ```

2. **Test from Task App:**
   ```bash
   # Get token from browser
   TOKEN="<paste-access-token>"
   
   curl http://localhost:8080/api/users/token-info \
     -H "Authorization: Bearer $TOKEN"
   ```
   
   Response will show which claims are present based on client scopes.

3. **Test from Admin Dashboard:**
   - Different token → different claims in response

**Demonstration 5: Create a custom protocol mapper**

1. **In Keycloak Admin UI:**
   - Go to Client scopes → task:read → Mappers tab
   - Click **Create**
   - **Name**: user-id-mapper
   - **Mapper Type**: User Property
   - **Property**: id
   - **Token Claim Name**: user_id
   - **Claim JSON Type**: String
   - **Add to access token**: ON
   - Click **Save**

2. **Login to Task App again** (need new token)
   - Inspect token: now includes `"user_id": "abc-123-def"`

3. **Use in backend:**
   ```java
   String userId = jwt.getClaim("user_id");
   // Now have Keycloak user ID in every request
   ```

**Demonstration 6: Conditional mappers (Advanced)**

Some mappers can be conditional based on user attributes or roles:

1. **Create a role-based mapper:**
   - Client scopes → Create new scope: `premium-features`
   - Add mapper: Hardcoded Claim Mapper
   - Claim name: `premium_tier`
   - Claim value: `gold`
   - This scope would only be assigned to premium clients

### Key Concepts

**Important points to understand:**

1. **Protocol mappers are scope-attached**
   - Scopes granted → mappers execute → claims added
   - No scope = no mapper execution = no claims

2. **Different clients get different information**
   - Task App token: work-related claims
   - Admin Dashboard token: authorization claims
   - Same user, different data based on client configuration

3. **Mapper types serve different purposes:**
   - User Property: Built-in user fields
   - User Attribute: Custom user metadata
   - Hardcoded: Static values for all users
   - Group Membership: User's groups
   - Role: User's roles
   - Audience: Token intended recipients

4. **Custom attributes require setup**
   - Mappers reference attribute names
   - Attributes must exist on users
   - Missing attributes → missing claims (null)

5. **Security implications:**
   - Don't map sensitive data to public scopes
   - Use audience mapper to restrict token usage
   - Minimize claims in tokens (performance + security)

**Common Issues and Solutions:**

**Issue 1: Mapper adds nothing to token**
- **Cause:** User attribute doesn't exist
- **Solution:** Check Users → Attributes tab, add the attribute

**Issue 2: Claim appears in ID token but not access token**
- **Cause:** Mapper config has "Add to access token" OFF
- **Solution:** Edit mapper, enable "Add to access token"

**Issue 3: Old claims still in token after mapper changes**
- **Cause:** Token cached in browser/backend
- **Solution:** Logout and login again to get fresh token

**Issue 4: Custom mapper not working**
- **Cause:** Mapper not assigned to any client scope
- **Solution:** Verify scope has the mapper, and client has the scope

**Comparison with Section 3 (Client Scopes):**

- **Section 3** explains WHAT scopes are (permissions, authorization)
- **Section 4** explains HOW scopes add information (protocol mappers, claims)
- Together: Scopes control access AND information disclosure

---

## 5. Role-Based Access Control

### What it is

**Roles** define who the user is and their general level of access.

**Our Roles:**
- `admin` - Full system access
- `project-manager` - Can create/manage projects and tasks
- `developer` - Can update status of assigned tasks
- `viewer` - Read-only access

**Roles + Scopes = Complete Authorization:**
- Roles: WHO you are
- Scopes: WHAT the client can do
- Both must be satisfied: `@RequiresScope("task:write") + @RolesAllowed("admin")`

### Where to see it in Keycloak Admin UI

1. **View realm roles:**
   - **Keycloak Admin** → **Realm roles**
   - See all 4 roles: admin, project-manager, developer, viewer

2. **View user roles:**
   - **Users** → Click **admin@taskmanager.com**
   - **Role mapping** tab
   - See assigned roles: admin

3. **View role in token:**
   - Login and inspect JWT token at https://jwt.io
   - Find `realm_access.roles` array:
     ```json
     "realm_access": {
       "roles": ["admin"]
     }
     ```

### Where it's implemented in code

**Backend Role Configuration:**
```
File: backend/src/main/resources/application.properties
Lines: 21-22

quarkus.oidc.roles.source=accesstoken
quarkus.oidc.roles.role-claim-path=realm_access/roles
```

**Role-Protected Endpoint:**
```
File: backend/src/main/java/com/taskmanager/resource/ProjectResource.java
Lines: 30-34

@POST
@RequiresScope("task:write")
@RolesAllowed({"admin", "project-manager"})  // Role check
public Response createProject(@Valid Project project) {
    Project created = projectService.createProject(project);
    return Response.status(Response.Status.CREATED).entity(created).build();
}
```

**Service Layer Ownership Check:**
```
File: backend/src/main/java/com/taskmanager/service/ProjectService.java
Lines: 56-63

private void validateProjectOwnership(Project project) {
    String userId = securityIdentity.getPrincipal().getName();
    boolean isAdmin = securityIdentity.hasRole("admin");
    
    if (!isAdmin && !project.creatorUserId.equals(userId)) {
        throw new ForbiddenException("You can only modify projects you created");
    }
}
```

**Frontend Role Check:**
```
File: task-frontend/src/pages/Projects.tsx
Lines: 25

const canCreateProject = hasRole('admin') || hasRole('project-manager');
```

### How to demonstrate it

1. **Admin role - full access:**
   - Login as `admin@taskmanager.com`
   - Can create projects
   - Can delete any project (even if not creator)
   - Can access Admin Dashboard
   - Can assign tasks

2. **Project Manager role - limited admin:**
   - Login as `manager@taskmanager.com`
   - Can create projects
   - Can only delete/edit projects they created
   - Cannot access Admin Dashboard (not admin role)
   - Can assign tasks within their projects

3. **Developer role - task updates only:**
   - Login as `dev@taskmanager.com`
   - No "Create Project" button (lacks admin/PM role)
   - Can view all projects and tasks
   - Can update status of tasks assigned to them
   - Try updating unassigned task → 403 Forbidden

4. **Viewer role - read-only:**
   - Login as `viewer@taskmanager.com`
   - Can view projects and tasks
   - No create/edit/delete buttons anywhere
   - All API write operations return 403

5. **Test backend enforcement:**
   - Login as developer
   - Try to create project via API (browser console):
     ```javascript
     fetch('http://localhost:8080/api/projects', {
       method: 'POST',
       headers: {
         'Authorization': 'Bearer ' + keycloak.token,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({name: 'Test', description: 'Hack'})
     })
     ```
   - Response: **403 Forbidden** - lacks project-manager or admin role

---

## 5. Token Validation

### What it is

**JWT Token Validation** ensures that:
1. Token is properly signed by Keycloak
2. Token hasn't expired
3. Token is for the correct audience (client)
4. Token issuer is the expected Keycloak realm

**Token Structure:**
- **Header**: Algorithm, token type
- **Payload**: User info, roles, scopes, expiration
- **Signature**: Cryptographic signature

### Where to see it in Keycloak Admin UI

1. **Token settings:**
   - **Clients** → **task-frontend-app** → **Advanced** tab
   - **Access Token Lifespan**: 5 minutes (300 seconds)
   - **Refresh Token Lifespan**: 30 minutes (1800 seconds)

2. **Realm keys:**
   - **Realm settings** → **Keys** tab
   - See RSA public keys used for signature verification
   - Backend fetches these keys from Keycloak's JWKS endpoint

### Where it's implemented in code

**Backend Token Validation (Automatic):**
```
File: backend/src/main/resources/application.properties
Lines: 15-19

quarkus.oidc.auth-server-url=http://localhost:8180/realms/taskmanager
quarkus.oidc.client-id=task-backend-api
quarkus.oidc.credentials.secret=backend-secret-key-change-in-production
quarkus.oidc.tls.verification=none
quarkus.oidc.token.issuer=http://localhost:8180/realms/taskmanager
```

Quarkus automatically:
- Fetches public keys from `{auth-server-url}/protocol/openid-connect/certs`
- Validates signature using RSA public key
- Checks expiration (`exp` claim)
- Validates issuer (`iss` claim)
- Validates audience (`aud` claim)

**Frontend Token Validation:**
```
File: task-frontend/src/services/api.ts
Lines: 19-29

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return new Promise((resolve, reject) => {
    updateToken(() => {  // Refresh if expired
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };
      fetch(url, { ...options, headers })
        .then(resolve)
        .catch(reject);
    });
  });
};
```

### How to demonstrate it

1. **View token contents:**
   - Login to Task Manager
   - Open DevTools → Application → Session Storage
   - Copy the token value
   - Go to https://jwt.io and paste
   - Observe:
     - **Header**: `{"alg": "RS256", "typ": "JWT"}`
     - **Payload**: User info, roles, scopes, exp, iss
     - **Signature**: Verified against Keycloak public key

2. **Test with expired token:**
   - Login and wait for token to expire (5 minutes)
   - OR manually change token expiration in storage
   - Try to make API call
   - Frontend automatically refreshes token
   - See "Token refreshed" toast notification

3. **Test with invalid signature:**
   - Login to Task Manager
   - Open DevTools → Application → Session Storage
   - Modify the token (change a few characters in the middle)
   - Make an API call
   - Response: **401 Unauthorized** - invalid signature

4. **Test with wrong issuer:**
   - Change backend `application.properties`:
     ```
     quarkus.oidc.token.issuer=http://wrong-issuer.com
     ```
   - Restart backend
   - Try to access API
   - All requests fail - issuer mismatch

---

## 6. Token Refresh Flow

### What it is

**Access tokens** expire quickly (5 minutes) for security.

**Refresh tokens** live longer (30 minutes) and can obtain new access tokens without re-authentication.

**Refresh Flow:**
1. Access token expires
2. App sends refresh token to Keycloak
3. Keycloak validates refresh token
4. Keycloak issues new access token + refresh token
5. App continues without user noticing

### Where to see it in Keycloak Admin UI

1. **Token lifespans:**
   - **Realm settings** → **Tokens** tab
   - **Access Token Lifespan**: 5 minutes
   - **Refresh Token Lifespan**: 30 minutes
   - **SSO Session Idle**: 30 minutes
   - **SSO Session Max**: 10 hours

### Where it's implemented in code

**Frontend Token Refresh:**
```
File: task-frontend/src/auth/keycloak.ts
Lines: 32-45

export const updateToken = (successCallback: () => void): void => {
  keycloak
    .updateToken(30)  // Refresh if token expires in < 30 seconds
    .then((refreshed) => {
      if (refreshed) {
        console.log('Token refreshed');
      }
      successCallback();
    })
    .catch(() => {
      console.error('Failed to refresh token');
      keycloak.login();  // Re-authenticate if refresh fails
    });
};
```

**Automatic Refresh in API Calls:**
```
File: task-frontend/src/services/api.ts
Lines: 19-21

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return new Promise((resolve, reject) => {
    updateToken(() => {  // Called before EVERY API request
      // ... make request with fresh token
    });
  });
};
```

**Token Expiration Monitoring:**
```
File: task-frontend/src/components/TokenStatus.tsx
Lines: 8-17

useEffect(() => {
  const updateTimeLeft = () => {
    if (keycloak.tokenParsed?.exp) {
      const expiresAt = keycloak.tokenParsed.exp * 1000;
      const now = Date.now();
      const left = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(left);
    }
  };
  
  updateTimeLeft();
  const interval = setInterval(updateTimeLeft, 1000);
  // ...
});
```

### How to demonstrate it

1. **Watch token expiration countdown:**
   - Login to Task Manager
   - Look at header - see "Token expires in: 5:00"
   - Watch it count down every second
   - Color changes: green → yellow (2min) → red (1min)

2. **Trigger token refresh:**
   - Wait for token to get close to expiration (< 30 seconds)
   - Make any API call (navigate, create project, etc.)
   - See "Token refreshed" toast notification
   - Countdown resets to 5:00 minutes

3. **Observe in Network tab:**
   - Open DevTools → Network
   - Wait for token to expire
   - Make an API call
   - See POST to `/protocol/openid-connect/token`:
     ```
     grant_type=refresh_token
     refresh_token=<REFRESH_TOKEN>
     ```
   - Response contains new access_token and refresh_token

4. **Refresh token expiration:**
   - Wait 30 minutes without any activity
   - Refresh token expires
   - Try to make API call
   - updateToken() fails
   - Automatic redirect to login page

---

## 7. SSO Between Applications

### What it is

**Single Sign-On (SSO)** allows users to authenticate once and access multiple applications without re-entering credentials.

**How it works:**
1. User logs into Task Manager
2. Keycloak creates a session
3. User navigates to Admin Dashboard
4. Admin Dashboard checks Keycloak session
5. User is already authenticated - no login prompt
6. Both apps share the same session

**Session storage:**
- Keycloak session stored in cookie
- Same realm, same SSO session
- Different clients, different tokens (with different scopes)

### Where to see it in Keycloak Admin UI

1. **Session management:**
   - **Clients** → **task-frontend-app** → **Advanced** tab
   - **SSO Session Idle**: 30 minutes
   - **SSO Session Max**: 10 hours

2. **View active sessions:**
   - **Users** → Find your user → **Sessions** tab
   - See active browser session
   - See associated clients

### Where it's implemented in code

**Both frontends use same realm:**
```
File: task-frontend/.env
VITE_KEYCLOAK_REALM=taskmanager

File: admin-dashboard/.env
VITE_KEYCLOAK_REALM=taskmanager
```

**Both use same Keycloak URL:**
```
File: task-frontend/src/auth/keycloak.ts
File: admin-dashboard/src/auth/keycloak.ts

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,  // Same URL
  realm: import.meta.env.VITE_KEYCLOAK_REALM,  // Same realm
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,  // Different clients
});
```

**Cross-app navigation:**
```
File: task-frontend/src/components/Header.tsx
Lines: 26-32

{showAdminLink && (
  <a
    href="http://localhost:5174"
    className="text-gray-700 hover:text-blue-600 font-medium"
    target="_blank"
    rel="noopener noreferrer"
  >
    Admin Dashboard
  </a>
)}
```

### How to demonstrate it

1. **SSO flow:**
   - Ensure you're logged out of everything
   - Open Task Manager (http://localhost:5173)
   - Login as `admin@taskmanager.com`
   - Note: Keycloak login page shown
   - Click "Admin Dashboard" link in header
   - New tab opens with Admin Dashboard
   - **Observe:** No login prompt - immediately authenticated!

2. **Verify shared session:**
   - In Task Manager, open DevTools → Application → Cookies
   - See Keycloak session cookies (KEYCLOAK_SESSION, etc.)
   - In Admin Dashboard, open DevTools → Application → Cookies
   - See the SAME Keycloak session cookies

3. **Different tokens, same session:**
   - In Task Manager console:
     ```javascript
     console.log('Task App scopes:', keycloak.tokenParsed.scope);
     // "... task:read task:write task:assign"
     ```
   - In Admin Dashboard console:
     ```javascript
     console.log('Admin Dashboard scopes:', keycloak.tokenParsed.scope);
     // "... task:read admin:users admin:stats"
     ```
   - Same user, same session, different token scopes!

4. **Logout from one app:**
   - Click "Logout" in Task Manager
   - Redirected to Keycloak logout
   - Go back to Admin Dashboard tab
   - Try to navigate or make API call
   - Automatically redirected to login
   - **Both apps logged out from SSO session**

5. **Session timeout:**
   - Login to both apps
   - Wait 30 minutes (SSO session idle timeout)
   - Try to use either app
   - Both redirect to login
   - Session expired for both

---

## 8. User Workflows

### 8.1 User Registration

#### What it is

Allows new users to create accounts without admin intervention.

#### Where to see it in Keycloak Admin UI

1. **Enable registration:**
   - **Realm settings** → **Login** tab
   - **User registration**: ON
   - **Email as username**: OFF
   - **Edit username**: OFF

#### How to demonstrate it

1. **Register new user:**
   - Go to Task Manager login page
   - Click "Register" link (on Keycloak login page)
   - Fill in form:
     - Username: testuser
     - Email: test@example.com
     - First name: Test
     - Last name: User
     - Password: test123
   - Submit form

2. **Email verification:**
   - Open MailHog (http://localhost:8025)
   - See verification email
   - Click verification link
   - Account verified

3. **First login:**
   - Login with new credentials
   - Redirected to Task Manager
   - User has no roles by default → limited access
   - Can only view projects/tasks (viewer-like access)

4. **Assign role as admin:**
   - Login to Keycloak Admin Console
   - **Users** → Find testuser
   - **Role mapping** tab → **Assign role**
   - Assign "developer" role
   - User logs out and back in
   - Now has developer permissions

### 8.2 Password Reset

#### What it is

Allows users to reset forgotten passwords via email.

#### Where to see it in Keycloak Admin UI

1. **Realm settings** → **Login** tab
   - **Forgot password**: ON

#### How to demonstrate it

1. **Initiate password reset:**
   - Go to login page
   - Click "Forgot password?"
   - Enter email: admin@taskmanager.com
   - Submit

2. **Check email:**
   - Open MailHog (http://localhost:8025)
   - See password reset email
   - Click reset link

3. **Set new password:**
   - Redirected to Keycloak
   - Enter new password
   - Confirm new password
   - Submit

4. **Login with new password:**
   - Go to Task Manager
   - Login with admin@taskmanager.com and new password
   - Success!

### 8.3 Email Verification

#### What it is

Ensures user email addresses are valid and owned by the user.

#### Where to see it in Keycloak Admin UI

1. **Realm settings** → **Login** tab
   - **Verify email**: ON

2. **View user verification status:**
   - **Users** → Find user
   - See "Email verified" field

#### How to demonstrate it

1. **Check pre-verified users:**
   - **Users** → admin@taskmanager.com
   - **Email verified**: Yes (set in realm import)

2. **Register new user (requires verification):**
   - Register as described in 8.1
   - User cannot login until email verified
   - Check MailHog for verification email
   - Click link to verify

3. **Resend verification email:**
   - If user didn't receive email:
   - **Users** → Find user
   - **Actions** → "Send verify email"
   - New email sent to MailHog

---

## Summary: Learning Path

**Recommended order for exploring concepts:**

1. **Start here:** Public vs Confidential Clients
   - Shows basic client types
   - Easy to see in Keycloak UI

2. **Auth flow:** Authorization Code + PKCE
   - Shows how users actually login
   - Can observe in browser DevTools

3. **Roles first:** Role-Based Access Control
   - Familiar concept (admin, user, etc.)
   - Easy to demonstrate with different logins

4. **Then scopes:** Client Scopes
   - Builds on roles
   - Shows defense in depth
   - Key "aha" moment: admin can't modify from Admin Dashboard!

5. **Under the hood:** Token Validation
   - Shows how backend validates
   - Explains JWT structure

6. **Token lifecycle:** Token Refresh Flow
   - Shows token expiration and refresh
   - Visual countdown widget helps

7. **Multiple apps:** SSO Between Applications
   - Brings it all together
   - Shows real-world scenario

8. **User experience:** User Workflows
   - Registration, password reset
   - Completes the picture

**Key Demonstrations:**

1. **Defense in depth:** Admin cannot create tasks from Admin Dashboard (lacks scope)
2. **Single Sign-On:** Login to Task Manager, open Admin Dashboard - no re-authentication needed
3. **Token refresh:** Watch countdown, see toast notification when token refreshes
4. **Role restrictions:** Login as developer - limited UI, backend enforces permissions
5. **Email flows:** Use MailHog to observe verification and password reset emails

