import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).keycloak = keycloak;
}

export default keycloak;

export const initKeycloak = (onAuthenticatedCallback: () => void) => {
  keycloak
    .init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })
    .then((authenticated) => {
      if (authenticated) {
        onAuthenticatedCallback();
      } else {
        console.warn('User is not authenticated');
        keycloak.login();
      }
    })
    .catch((error) => {
      console.error('Keycloak initialization failed', error);
    });
};

export const getToken = (): string | undefined => {
  return keycloak.token;
};

export const updateToken = (successCallback: () => void): void => {
  keycloak
    .updateToken(30)
    .then((refreshed) => {
      if (refreshed) {
        console.log('Token refreshed');
      }
      successCallback();
    })
    .catch(() => {
      console.error('Failed to refresh token');
      keycloak.login();
    });
};

export const doLogout = (): void => {
  keycloak.logout({
    redirectUri: window.location.origin,
  });
};

export const getUsername = (): string | undefined => {
  if (!keycloak.tokenParsed) {
    return undefined;
  }

  // Try multiple claims in order of preference
  return (
    keycloak.tokenParsed.preferred_username ||
    keycloak.tokenParsed.name ||
    keycloak.tokenParsed.email ||
    keycloak.tokenParsed.sub
  );
};

export const hasRole = (role: string): boolean => {
  return keycloak.hasRealmRole(role);
};

export const isAdmin = (): boolean => {
  return hasRole('admin');
};
