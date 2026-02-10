import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar">
      <h2 class="title">CRM</h2>
      <ul class="nav-list">
        <li>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Dashboard
          </a>
        </li>
        <li>
          <a routerLink="/contacts" routerLinkActive="active">
            Contacts
          </a>
        </li>
        @if (authStore.isSuperuser()) {
          <li>
            <a routerLink="/admin" routerLinkActive="active">
              Admin
            </a>
          </li>
        }
        <li>
          <a routerLink="/settings" routerLinkActive="active">
            Settings
          </a>
        </li>
      </ul>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      min-height: 100vh;
      background: #1a202c;
      color: white;
      padding: 24px 16px;
      box-sizing: border-box;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin: 0 0 32px 8px;
    }
    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .nav-list li a {
      display: block;
      padding: 10px 12px;
      color: #a0aec0;
      text-decoration: none;
      border-radius: 6px;
      margin-bottom: 4px;
      transition: background 0.2s, color 0.2s;
    }
    .nav-list li a:hover {
      background: #2d3748;
      color: white;
    }
    .nav-list li a.active {
      background: #3182ce;
      color: white;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  authStore = inject(AuthStore);
}
