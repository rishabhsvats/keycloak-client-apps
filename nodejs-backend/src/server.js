const express = require('express');
const cors = require('cors');
const Keycloak = require('keycloak-connect');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3001;

// Session store for Keycloak (required by keycloak-connect)
const memoryStore = new session.MemoryStore();

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'xDk6qW0MnpZHazxzDnzrKIwHhlPqBDYI',
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  })
);

// Keycloak configuration - use keycloak.json or env vars
const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'master',
  'auth-server-url': process.env.KEYCLOAK_URL || 'http://localhost:8080/',
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'nodejs-backend',
  'bearer-only': true,
  'public-client': false,
};

const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
app.use(keycloak.middleware());

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ---------- Unsecured (public) endpoints ----------

app.get('/api/public/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nodejs-backend',
    timestamp: new Date().toISOString(),
    message: 'Public endpoint - no authentication required',
  });
});

app.get('/api/public/info', (req, res) => {
  res.json({
    message: 'This is a public endpoint. Anyone can access it.',
    version: '1.0.0',
  });
});

// ---------- Secured endpoints (require valid Keycloak token) ----------

app.get('/api/secured/me', keycloak.protect(), (req, res) => {
  const token = req.kauth?.grant?.access_token;
  const payload = token?.content || (typeof token?.toUserInfo === 'function' ? {} : token) || {};
  const user = payload.preferred_username || payload.sub || 'authenticated';
  res.json({
    message: 'Secured endpoint - you are authenticated',
    user,
    email: payload.email,
    realm: payload.iss ? payload.iss.split('/').pop() : undefined,
  });
});

app.get('/api/secured/data', keycloak.protect(), (req, res) => {
  res.json({
    message: 'Protected data',
    items: [
      { id: 1, name: 'Item A', type: 'secured' },
      { id: 2, name: 'Item B', type: 'secured' },
    ],
  });
});

// Return and print the complete Bearer token (raw + decoded payload)
function decodeJwtPayload(token) {
  if (!token || !token.includes('.')) return {};
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return { error: 'Opaque or invalid token' };
  }
}

app.get('/api/secured/token', keycloak.protect(), (req, res) => {
  const rawToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!rawToken) {
    return res.json({
      message: 'No Bearer token found',
      rawToken: '',
      decodedPayload: {},
    });
  }
  console.log('=== Bearer token (complete) ===');
  console.log(rawToken);
  console.log('=== End token ===');
  const decodedPayload = decodeJwtPayload(rawToken);
  res.json({
    message: 'Token consumed and printed to server log',
    rawToken,
    decodedPayload,
  });
});

// Protect with specific realm role (optional)
app.get('/api/secured/admin', keycloak.protect('realm:admin'), (req, res) => {
  res.json({
    message: 'Admin-only endpoint',
    note: 'Only users with realm role "admin" can access this.',
  });
});

app.listen(port, () => {
  console.log(`Node.js backend running at http://localhost:${port}`);
  console.log('  Public:  GET /api/public/health, GET /api/public/info');
  console.log('  Secured: GET /api/secured/me, GET /api/secured/data, GET /api/secured/token');
  console.log('  Admin:   GET /api/secured/admin (realm:admin)');
});
