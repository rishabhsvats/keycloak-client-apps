import { useState } from 'react';
import { keycloak } from './keycloak';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeader() {
  if (keycloak.token) {
    keycloak.updateToken(30).catch(() => keycloak.login());
    return { Authorization: `Bearer ${keycloak.token}` };
  }
  return {};
}

export function SecuredPage() {
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState({ me: false, data: false, token: false });
  const [error, setError] = useState(null);

  const fetchMe = async () => {
    if (!keycloak.authenticated) {
      keycloak.login();
      return;
    }
    setLoading((l) => ({ ...l, me: true }));
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/secured/me`, { headers: getAuthHeader() });
      if (res.status === 401) {
        keycloak.login();
        return;
      }
      const json = await res.json();
      setMe(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((l) => ({ ...l, me: false }));
    }
  };

  const fetchData = async () => {
    if (!keycloak.authenticated) {
      keycloak.login();
      return;
    }
    setLoading((l) => ({ ...l, data: true }));
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/secured/data`, { headers: getAuthHeader() });
      if (res.status === 401) {
        keycloak.login();
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((l) => ({ ...l, data: false }));
    }
  };

  const fetchToken = async () => {
    if (!keycloak.authenticated) {
      keycloak.login();
      return;
    }
    setLoading((l) => ({ ...l, token: true }));
    setError(null);
    setToken(null);
    try {
      const res = await fetch(`${API_BASE}/api/secured/token`, { headers: getAuthHeader() });
      if (res.status === 401) {
        keycloak.login();
        return;
      }
      const json = await res.json();
      setToken(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((l) => ({ ...l, token: false }));
    }
  };

  if (!keycloak.authenticated) {
    return (
      <section>
        <h2>Secured endpoints</h2>
        <p>Log in with Keycloak to call protected Node.js backend endpoints.</p>
        <button className="primary" onClick={() => keycloak.login()}>
          Login
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2>Secured endpoints (Bearer token)</h2>
      <p>Calls to the Node.js backend include your Keycloak access token.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={fetchMe} disabled={loading.me}>
          {loading.me ? 'Loading…' : 'GET /api/secured/me'}
        </button>
        <button onClick={fetchData} disabled={loading.data}>
          {loading.data ? 'Loading…' : 'GET /api/secured/data'}
        </button>
        <button onClick={fetchToken} disabled={loading.token}>
          {loading.token ? 'Loading…' : 'Print token'}
        </button>
      </div>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      {me && (
        <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify(me, null, 2)}
        </pre>
      )}
      {data && (
        <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      {token && (
        <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify(token, null, 2)}
        </pre>
      )}
    </section>
  );
}
