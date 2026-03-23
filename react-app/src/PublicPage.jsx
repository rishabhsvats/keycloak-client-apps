import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function PublicPage() {
  const [health, setHealth] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState({ health: false, info: false });
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading((l) => ({ ...l, health: true }));
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/public/health`);
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((l) => ({ ...l, health: false }));
    }
  };

  const fetchInfo = async () => {
    setLoading((l) => ({ ...l, info: true }));
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/public/info`);
      const data = await res.json();
      setInfo(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading((l) => ({ ...l, info: false }));
    }
  };

  return (
    <section>
      <h2>Public endpoints (no login)</h2>
      <p>These call the Node.js backend without authentication.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={fetchHealth} disabled={loading.health}>
          {loading.health ? 'Loading…' : 'GET /api/public/health'}
        </button>
        <button onClick={fetchInfo} disabled={loading.info}>
          {loading.info ? 'Loading…' : 'GET /api/public/info'}
        </button>
      </div>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      {health && (
        <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      )}
      {info && (
        <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: 8, overflow: 'auto' }}>
          {JSON.stringify(info, null, 2)}
        </pre>
      )}
    </section>
  );
}
