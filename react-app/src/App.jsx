import { useState } from 'react';
import { keycloak } from './keycloak';
import { PublicPage } from './PublicPage';
import { SecuredPage } from './SecuredPage';

const API_BASE = import.meta.env.VITE_API_URL || '';

function App() {
  const [view, setView] = useState('public');
  const isLoggedIn = keycloak.authenticated;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <header style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>React + Keycloak</h1>
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={view === 'public' ? 'primary' : ''} onClick={() => setView('public')}>
            Public
          </button>
          <button className={view === 'secured' ? 'primary' : ''} onClick={() => setView('secured')}>
            Secured
          </button>
        </nav>
        <span style={{ marginLeft: 'auto' }}>
          {isLoggedIn ? (
            <>
              <span style={{ marginRight: '0.5rem' }}>{keycloak.tokenParsed?.preferred_username ?? 'User'}</span>
              <button onClick={() => keycloak.logout()}>Logout</button>
            </>
          ) : (
            <button className="primary" onClick={() => keycloak.login()}>
              Login
            </button>
          )}
        </span>
      </header>

      {view === 'public' && <PublicPage />}
      {view === 'secured' && <SecuredPage />}
    </div>
  );
}

export default App;
