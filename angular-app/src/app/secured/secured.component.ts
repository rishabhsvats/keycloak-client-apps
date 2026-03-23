import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import Keycloak from 'keycloak-js';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-secured',
  standalone: true,
  imports: [JsonPipe],
  template: `
    @if (!keycloak.authenticated) {
      <section>
        <h2>Secured endpoints</h2>
        <p>Log in with Keycloak to call protected Node.js backend endpoints.</p>
        <button class="primary" (click)="keycloak.login()">Login</button>
      </section>
    } @else {
      <section>
        <h2>Secured endpoints (Bearer token)</h2>
        <p>Calls to the Node.js backend include your Keycloak access token.</p>
        <div class="actions">
          <button (click)="fetchMe()" [disabled]="loadingMe">{{ loadingMe ? 'Loading…' : 'GET /api/secured/me' }}</button>
          <button (click)="fetchData()" [disabled]="loadingData">{{ loadingData ? 'Loading…' : 'GET /api/secured/data' }}</button>
          <button (click)="fetchToken()" [disabled]="loadingToken">{{ loadingToken ? 'Loading…' : 'Print token' }}</button>
        </div>
        @if (error) {
          <p class="error">{{ error }}</p>
        }
        @if (me) {
          <pre>{{ me | json }}</pre>
        }
        @if (data) {
          <pre>{{ data | json }}</pre>
        }
        @if (token) {
          <pre>{{ token | json }}</pre>
        }
      </section>
    }
  `,
  styles: [`
    .actions { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .error { color: #f87171; }
    pre { background: #1e293b; padding: 1rem; border-radius: 8px; overflow: auto; }
  `],
})
export class SecuredComponent {
  me: Record<string, unknown> | null = null;
  data: Record<string, unknown> | null = null;
  token: Record<string, unknown> | null = null;
  loadingMe = false;
  loadingData = false;
  loadingToken = false;
  error: string | null = null;

  constructor(
    public keycloak: Keycloak,
    private api: ApiService,
  ) {}

  fetchMe(): void {
    this.loadingMe = true;
    this.error = null;
    this.api.getSecuredMe().subscribe({
      next: (d) => { this.me = d; this.loadingMe = false; },
      error: (err) => {
        this.error = err.message;
        this.loadingMe = false;
        if (err.status === 401) this.keycloak.login();
      },
    });
  }

  fetchData(): void {
    this.loadingData = true;
    this.error = null;
    this.api.getSecuredData().subscribe({
      next: (d) => { this.data = d; this.loadingData = false; },
      error: (err) => {
        this.error = err.message;
        this.loadingData = false;
        if (err.status === 401) this.keycloak.login();
      },
    });
  }

  fetchToken(): void {
    this.loadingToken = true;
    this.error = null;
    this.token = null;
    this.api.getSecuredToken().subscribe({
      next: (d) => { this.token = d; this.loadingToken = false; },
      error: (err) => {
        this.error = err.message;
        this.loadingToken = false;
        if (err.status === 401) this.keycloak.login();
      },
    });
  }
}
