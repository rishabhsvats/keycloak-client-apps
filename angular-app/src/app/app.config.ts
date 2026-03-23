import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  createInterceptorCondition,
  includeBearerTokenInterceptor,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  provideKeycloak,
} from 'keycloak-angular';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

const apiUrlCondition = createInterceptorCondition({
  urlPattern: /^\/api\/secured/i,
  bearerPrefix: 'Bearer',
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideKeycloak({
      config: {
        url: 'http://localhost:8080',
        realm: 'master',
        clientId: 'angular-app',
      },
      initOptions: {
        onLoad: 'check-sso',
        checkLoginIframe: false,
      },
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [apiUrlCondition],
    },
    provideHttpClient(withFetch(), withInterceptors([includeBearerTokenInterceptor])),
  ],
};
