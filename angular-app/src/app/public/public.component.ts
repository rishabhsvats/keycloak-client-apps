import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-public',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <section>
      <h2>Public endpoints (no login)</h2>
      <p>These call the Node.js backend without authentication.</p>
      <div class="actions">
        <button (click)="fetchHealth()" [disabled]="loadingHealth">{{ loadingHealth ? 'Loading…' : 'GET /api/public/health' }}</button>
        <button (click)="fetchInfo()" [disabled]="loadingInfo">{{ loadingInfo ? 'Loading…' : 'GET /api/public/info' }}</button>
      </div>
      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (health) {
        <pre>{{ health | json }}</pre>
      }
      @if (info) {
        <pre>{{ info | json }}</pre>
      }
    </section>
  `,
  styles: [`
    .actions { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .error { color: #f87171; }
    pre { background: #1e293b; padding: 1rem; border-radius: 8px; overflow: auto; }
  `],
})
export class PublicComponent {
  health: Record<string, unknown> | null = null;
  info: Record<string, unknown> | null = null;
  loadingHealth = false;
  loadingInfo = false;
  error: string | null = null;

  constructor(private api: ApiService) {}

  fetchHealth(): void {
    this.loadingHealth = true;
    this.error = null;
    this.api.getPublicHealth().subscribe({
      next: (data) => { this.health = data; this.loadingHealth = false; },
      error: (err) => { this.error = err.message; this.loadingHealth = false; },
    });
  }

  fetchInfo(): void {
    this.loadingInfo = true;
    this.error = null;
    this.api.getPublicInfo().subscribe({
      next: (data) => { this.info = data; this.loadingInfo = false; },
      error: (err) => { this.error = err.message; this.loadingInfo = false; },
    });
  }
}
