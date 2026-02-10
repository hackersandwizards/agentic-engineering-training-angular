import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatButtonModule, MatMenuModule, MatIconModule],
  template: `
    <mat-toolbar class="navbar">
      <span class="title">Contact Management</span>
      <span class="spacer"></span>
      <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn" aria-label="User menu">
        {{ authStore.user()?.full_name || authStore.user()?.email }}
        <mat-icon>arrow_drop_down</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <div class="menu-email">{{ authStore.user()?.email }}</div>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          Sign out
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      color: #1a202c;
    }
    .title {
      font-size: 18px;
      font-weight: 600;
    }
    .spacer {
      flex: 1;
    }
    .user-btn {
      text-transform: none;
    }
    .menu-email {
      padding: 8px 16px;
      color: #718096;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  authStore = inject(AuthStore);
  private router = inject(Router);

  logout(): void {
    this.authStore.clearAuth();
    this.router.navigate(['/login']);
  }
}
