import React from 'react';
import ReactDOM from 'react-dom/client';
import { keycloak } from './keycloak';
import App from './App';
import './index.css';

keycloak
  .init({ onLoad: 'check-sso', checkLoginIframe: false })
  .then((authenticated) => {
    if (authenticated) {
      console.log('User is logged in');
    }
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((err) => {
    console.error('Keycloak init failed', err);
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
