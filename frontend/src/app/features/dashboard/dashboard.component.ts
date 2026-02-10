import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthStore } from '../../core/state/auth.store';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule],
  template: `
    <h1>Welcome{{ authStore.user()?.full_name ? ', ' + authStore.user()!.full_name : '' }}!</h1>
    <div class="stats">
      <mat-card class="stat-card">
        <mat-card-header>
          <mat-card-title>{{ contactCount() }}</mat-card-title>
          <mat-card-subtitle>Total Contacts</mat-card-subtitle>
        </mat-card-header>
      </mat-card>
    </div>
  `,
  styles: [`
    h1 { margin-bottom: 24px; color: #1a202c; }
    .stats { display: flex; gap: 16px; }
    .stat-card { min-width: 200px; }
  `]
})
export class DashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  private contactService = inject(ContactService);
  contactCount = signal(0);

  ngOnInit(): void {
    this.contactService.getContacts(0, 1).subscribe({
      next: res => this.contactCount.set(res.count)
    });
  }
}
