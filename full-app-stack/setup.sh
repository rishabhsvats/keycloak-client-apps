#!/bin/bash

# Complete setup script for the Task Management System with Keycloak
# Configures protocol mappers, client scopes, roles, users, and user attributes

set -e

KEYCLOAK_URL="http://localhost:8180"
REALM="taskmanager"

echo "════════════════════════════════════════════════════════════"
echo "  Task Manager - Keycloak Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if Keycloak is running
if ! curl -s "$KEYCLOAK_URL" > /dev/null 2>&1; then
    echo "⚠️  Keycloak is not running!"
    echo ""
    echo "Start with: docker-compose up -d"
    echo "Then run this script again."
    exit 1
fi

echo "✓ Keycloak is running"

# Get admin token
echo "Authenticating as admin..."
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token' 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  echo "✗ Failed to authenticate. Wait 30 seconds for Keycloak to be ready."
  exit 1
fi

echo "✓ Authenticated"
echo ""

# Enable unmanaged attributes
echo "════════════════════════════════════════════════════════════"
echo "Step 1: Enabling Unmanaged Attributes"
echo "════════════════════════════════════════════════════════════"
echo ""

# Try via User Profile API (Keycloak 26.x+)
echo "Attempting to enable via User Profile API..."

# Get current user profile config
USER_PROFILE=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/users/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

# Update unmanagedAttributePolicy
UPDATED_PROFILE=$(echo "$USER_PROFILE" | jq '.unmanagedAttributePolicy = "ENABLED"')

# Send update
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$KEYCLOAK_URL/admin/realms/$REALM/users/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATED_PROFILE")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
  echo "✓ Unmanaged attributes enabled via API"
else
  echo "⚠️  API method failed (HTTP $HTTP_CODE), trying alternate method..."

  # Try updating via realm attributes
  REALM_CONFIG=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

  UPDATED_REALM=$(echo "$REALM_CONFIG" | jq '.attributes.unmanagedAttributePolicy = "ENABLED"')

  REALM_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$KEYCLOAK_URL/admin/realms/$REALM" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$UPDATED_REALM")

  REALM_HTTP=$(echo "$REALM_RESPONSE" | tail -n 1)

  if [ "$REALM_HTTP" = "200" ] || [ "$REALM_HTTP" = "204" ]; then
    echo "✓ Unmanaged attributes enabled via realm config"
  else
    echo "✗ Automatic enable failed"
    echo ""
    echo "MANUAL STEP REQUIRED:"
    echo "──────────────────────────────────────────────────────────"
    echo "1. Open: http://localhost:8180/admin/master/console/#/taskmanager/realm-settings"
    echo "2. Click 'User Profile' tab"
    echo "3. Find 'Unmanaged attributes' setting"
    echo "4. Change to 'Enabled'"
    echo "5. Click 'Save'"
    echo "──────────────────────────────────────────────────────────"
    echo ""
    read -p "Press Enter after you've enabled it..."
  fi
fi
echo ""

# Function to get scope ID
get_scope_id() {
  curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/client-scopes" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r ".[] | select(.name==\"$1\") | .id"
}

# Function to get client ID
get_client_id() {
  curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/clients" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r ".[] | select(.clientId==\"$1\") | .id"
}

# Function to assign scope to client as default
assign_scope_to_client() {
  local client_id=$1
  local scope_id=$2
  local scope_name=$3

  # Check if already assigned
  local assigned=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/clients/$client_id/default-client-scopes" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r ".[] | select(.id==\"$scope_id\") | .id")

  if [ -n "$assigned" ]; then
    echo "  - $scope_name (already assigned)"
  else
    curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM/clients/$client_id/default-client-scopes/$scope_id" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
    echo "  + $scope_name"
  fi
}

# Function to check if mapper exists
mapper_exists() {
  local scope_id=$1
  local mapper_name=$2
  local count=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/client-scopes/$scope_id/protocol-mappers/models" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq "[.[] | select(.name==\"$mapper_name\")] | length")
  [ "$count" -gt 0 ]
}

# Function to add mapper
add_mapper() {
  local scope_id=$1
  local mapper_name=$2
  local mapper_json=$3

  if mapper_exists "$scope_id" "$mapper_name"; then
    echo "  - $mapper_name (already exists)"
  else
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/client-scopes/$scope_id/protocol-mappers/models" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$mapper_json" > /dev/null
    echo "  + $mapper_name"
  fi
}

# Function to add user attributes
set_user_attrs() {
  local username=$1
  local attrs=$2

  local user_id=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$username&exact=true" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

  if [ -n "$user_id" ] && [ "$user_id" != "null" ]; then
    curl -s -X PUT "$KEYCLOAK_URL/admin/realms/$REALM/users/$user_id" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"attributes\": $attrs}" > /dev/null
    echo "  ✓ $username"
  fi
}

echo "════════════════════════════════════════════════════════════"
echo "Step 2: Adding Protocol Mappers"
echo "════════════════════════════════════════════════════════════"
echo ""

# task:read - Basic identity
echo "task:read (basic identity):"
SCOPE_ID=$(get_scope_id "task:read")
if [ -n "$SCOPE_ID" ]; then
  add_mapper "$SCOPE_ID" "full-name-mapper" '{"name":"full-name-mapper","protocol":"openid-connect","protocolMapper":"oidc-full-name-mapper","config":{"id.token.claim":"true","access.token.claim":"true"}}'
  add_mapper "$SCOPE_ID" "email-mapper" '{"name":"email-mapper","protocol":"openid-connect","protocolMapper":"oidc-usermodel-property-mapper","config":{"user.attribute":"email","claim.name":"email","jsonType.label":"String","access.token.claim":"true"}}'
  add_mapper "$SCOPE_ID" "username-mapper" '{"name":"username-mapper","protocol":"openid-connect","protocolMapper":"oidc-usermodel-property-mapper","config":{"user.attribute":"username","claim.name":"preferred_username","jsonType.label":"String","access.token.claim":"true"}}'
fi
echo ""

# task:write - Professional context
echo "task:write (professional context):"
SCOPE_ID=$(get_scope_id "task:write")
if [ -n "$SCOPE_ID" ]; then
  add_mapper "$SCOPE_ID" "department-mapper" '{"name":"department-mapper","protocol":"openid-connect","protocolMapper":"oidc-usermodel-attribute-mapper","config":{"user.attribute":"department","claim.name":"department","jsonType.label":"String","access.token.claim":"true"}}'
  add_mapper "$SCOPE_ID" "job-title-mapper" '{"name":"job-title-mapper","protocol":"openid-connect","protocolMapper":"oidc-usermodel-attribute-mapper","config":{"user.attribute":"jobTitle","claim.name":"job_title","jsonType.label":"String","access.token.claim":"true"}}'
fi
echo ""

# task:assign - Organizational structure
echo "task:assign (organizational structure):"
SCOPE_ID=$(get_scope_id "task:assign")
if [ -n "$SCOPE_ID" ]; then
  add_mapper "$SCOPE_ID" "team-mapper" '{"name":"team-mapper","protocol":"openid-connect","protocolMapper":"oidc-usermodel-attribute-mapper","config":{"user.attribute":"team","claim.name":"team","jsonType.label":"String","access.token.claim":"true"}}'
  add_mapper "$SCOPE_ID" "manager-mapper" '{"name":"manager-mapper","protocol":"openid-connect","protocolMapper":"oidc-usermodel-attribute-mapper","config":{"user.attribute":"manager","claim.name":"manager_email","jsonType.label":"String","access.token.claim":"true"}}'
fi
echo ""

# admin:users - Admin metadata
echo "admin:users (admin metadata):"
SCOPE_ID=$(get_scope_id "admin:users")
if [ -n "$SCOPE_ID" ]; then
  add_mapper "$SCOPE_ID" "admin-level-mapper" '{"name":"admin-level-mapper","protocol":"openid-connect","protocolMapper":"oidc-usermodel-attribute-mapper","config":{"user.attribute":"adminLevel","claim.name":"admin_level","jsonType.label":"String","access.token.claim":"true"}}'
fi
echo ""

# admin:stats - System claims
echo "admin:stats (system claims):"
SCOPE_ID=$(get_scope_id "admin:stats")
if [ -n "$SCOPE_ID" ]; then
  add_mapper "$SCOPE_ID" "audience-mapper" '{"name":"audience-mapper","protocol":"openid-connect","protocolMapper":"oidc-audience-mapper","config":{"included.custom.audience":"admin-api","access.token.claim":"true"}}'
  add_mapper "$SCOPE_ID" "access-level-mapper" '{"name":"access-level-mapper","protocol":"openid-connect","protocolMapper":"oidc-hardcoded-claim-mapper","config":{"claim.name":"access_level","claim.value":"full","jsonType.label":"String","access.token.claim":"true"}}'
fi
echo ""

echo "════════════════════════════════════════════════════════════"
echo "Step 3: Assigning Client Scopes to Clients"
echo "════════════════════════════════════════════════════════════"
echo ""

# Get client IDs
TASK_FRONTEND_ID=$(get_client_id "task-frontend-app")
ADMIN_DASHBOARD_ID=$(get_client_id "admin-dashboard-frontend")

# Assign scopes to task-frontend-app
echo "task-frontend-app:"
if [ -n "$TASK_FRONTEND_ID" ]; then
  SCOPE_ID=$(get_scope_id "task:read")
  [ -n "$SCOPE_ID" ] && assign_scope_to_client "$TASK_FRONTEND_ID" "$SCOPE_ID" "task:read"

  SCOPE_ID=$(get_scope_id "task:write")
  [ -n "$SCOPE_ID" ] && assign_scope_to_client "$TASK_FRONTEND_ID" "$SCOPE_ID" "task:write"

  SCOPE_ID=$(get_scope_id "task:assign")
  [ -n "$SCOPE_ID" ] && assign_scope_to_client "$TASK_FRONTEND_ID" "$SCOPE_ID" "task:assign"
else
  echo "  ✗ Client not found"
fi
echo ""

# Assign scopes to admin-dashboard-frontend
echo "admin-dashboard-frontend:"
if [ -n "$ADMIN_DASHBOARD_ID" ]; then
  SCOPE_ID=$(get_scope_id "task:read")
  [ -n "$SCOPE_ID" ] && assign_scope_to_client "$ADMIN_DASHBOARD_ID" "$SCOPE_ID" "task:read"

  SCOPE_ID=$(get_scope_id "admin:users")
  [ -n "$SCOPE_ID" ] && assign_scope_to_client "$ADMIN_DASHBOARD_ID" "$SCOPE_ID" "admin:users"

  SCOPE_ID=$(get_scope_id "admin:stats")
  [ -n "$SCOPE_ID" ] && assign_scope_to_client "$ADMIN_DASHBOARD_ID" "$SCOPE_ID" "admin:stats"
else
  echo "  ✗ Client not found"
fi
echo ""

echo "════════════════════════════════════════════════════════════"
echo "Step 4: Creating Test Users (if not exist)"
echo "════════════════════════════════════════════════════════════"
echo ""

# Function to create user if not exists
create_user() {
  local username=$1
  local email=$2
  local password=$3
  local first_name=$4
  local last_name=$5
  local role=$6

  # Check if user exists
  local user_id=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$username&exact=true" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id // empty')

  if [ -n "$user_id" ]; then
    echo "  - $username (already exists)"
    echo "$user_id"
  else
    # Create user
    local create_payload=$(cat <<EOF
{
  "username": "$username",
  "email": "$email",
  "firstName": "$first_name",
  "lastName": "$last_name",
  "enabled": true,
  "emailVerified": true,
  "credentials": [{
    "type": "password",
    "value": "$password",
    "temporary": false
  }]
}
EOF
)
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$create_payload" > /dev/null

    # Get the created user ID
    user_id=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$username&exact=true" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

    # Get role ID and assign
    local role_id=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r ".[] | select(.name==\"$role\") | .id")

    if [ -n "$role_id" ]; then
      curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/users/$user_id/role-mappings/realm" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "[{\"id\":\"$role_id\",\"name\":\"$role\"}]" > /dev/null
    fi

    echo "  + $username (created with role: $role)"
    echo "$user_id"
  fi
}

# Create roles if they don't exist
create_role() {
  local role_name=$1
  local exists=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r ".[] | select(.name==\"$role_name\") | .name")

  if [ -z "$exists" ]; then
    curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"$role_name\"}" > /dev/null
    echo "  + Role: $role_name"
  fi
}

echo "Creating roles..."
create_role "admin"
create_role "project-manager"
create_role "developer"
create_role "viewer"
echo ""

echo "Creating users..."
ADMIN_ID=$(create_user "admin@taskmanager.com" "admin@taskmanager.com" "admin123" "Admin" "User" "admin")
MANAGER_ID=$(create_user "manager@taskmanager.com" "manager@taskmanager.com" "manager123" "Project" "Manager" "project-manager")
DEV_ID=$(create_user "dev@taskmanager.com" "dev@taskmanager.com" "dev123" "Software" "Developer" "developer")
VIEWER_ID=$(create_user "viewer@taskmanager.com" "viewer@taskmanager.com" "viewer123" "Test" "Viewer" "viewer")
echo ""

echo "════════════════════════════════════════════════════════════"
echo "Step 5: Adding User Attributes"
echo "════════════════════════════════════════════════════════════"
echo ""

set_user_attrs "admin@taskmanager.com" '{"department":["Administration"],"jobTitle":["System Administrator"],"team":["IT Operations"],"adminLevel":["Super Admin"]}'

set_user_attrs "manager@taskmanager.com" '{"department":["Engineering"],"jobTitle":["Senior Project Manager"],"team":["Platform Team"],"manager":["admin@taskmanager.com"]}'

set_user_attrs "dev@taskmanager.com" '{"department":["Engineering"],"jobTitle":["Software Developer"],"team":["Platform Team"],"manager":["manager@taskmanager.com"]}'

set_user_attrs "viewer@taskmanager.com" '{"department":["Product"],"jobTitle":["Product Analyst"],"team":["Product Team"],"manager":["admin@taskmanager.com"]}'

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✓ Setup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Start backend:  cd backend && ./mvnw quarkus:dev"
echo "2. Start frontend: cd task-frontend && npm run dev"
echo "3. Start admin:    cd admin-dashboard && npm run dev"
echo ""
echo "Test protocol mappers:"
echo "- Login to http://localhost:5173 as manager@taskmanager.com"
echo "- Open DevTools → Console → Run:"
echo "  console.log(keycloak.tokenParsed)"
echo ""
echo "You should see claims like department, job_title, team, etc."
echo ""
