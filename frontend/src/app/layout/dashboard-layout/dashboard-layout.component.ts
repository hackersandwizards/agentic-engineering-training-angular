import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthStore } from '../../core/state/auth.store';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  template: `
    <div class="layout">
      <app-sidebar />
      <div class="main">
        <app-navbar />
        <div class="content">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .content {
      flex: 1;
      padding: 24px;
      background: #f7fafc;
    }
  `]
})
export class DashboardLayoutComponent implements OnInit {
  private authStore = inject(AuthStore);
  private authService = inject(AuthService);

  ngOnInit(): void {
    if (this.authStore.isAuthenticated() && !this.authStore.user()) {
      this.authService.testToken().subscribe({
        next: user => this.authStore.setUser(user),
        error: () => this.authStore.clearAuth()
      });
    }
  }
}
