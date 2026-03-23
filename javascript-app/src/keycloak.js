import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'master',
  clientId: 'javascript-app',
};

export const keycloak = new Keycloak(keycloakConfig);
