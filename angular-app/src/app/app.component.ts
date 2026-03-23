import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="layout">
      <header>
        <h1>Angular + Keycloak</h1>
        <nav>
          <a routerLink="/public" routerLinkActive="active">Public</a>
          <a routerLink="/secured" routerLinkActive="active">Secured</a>
        </nav>
        <span class="auth">
          @if (isLoggedIn()) {
            <span>{{ username() }}</span>
            <button (click)="logout()">Logout</button>
          } @else {
            <button class="primary" (click)="login()">Login</button>
          }
        </span>
      </header>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout { padding: 1.5rem; max-width: 800px; margin: 0 auto; }
    header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
    h1 { margin: 0; }
    nav { display: flex; gap: 0.5rem; }
    nav a { color: #38bdf8; text-decoration: none; padding: 0.25rem 0.5rem; border-radius: 4px; }
    nav a.active { background: #1e293b; }
    .auth { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
  `],
})
export class AppComponent {
  constructor(private keycloak: Keycloak) {}

  isLoggedIn(): boolean {
    return this.keycloak.authenticated === true;
  }

  username(): string {
    const parsed = this.keycloak.tokenParsed as { preferred_username?: string } | undefined;
    return parsed?.preferred_username ?? 'User';
  }

  login(): void {
    this.keycloak.login();
  }

  logout(): void {
    this.keycloak.logout();
  }
}
