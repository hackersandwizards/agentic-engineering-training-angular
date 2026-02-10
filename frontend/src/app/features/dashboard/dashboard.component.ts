import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../core/state/auth.store';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatProgressBarModule],
  template: `
    <h1>Welcome{{ authStore.user()?.full_name ? ', ' + authStore.user()!.full_name : '' }}!</h1>
    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  private contactService = inject(ContactService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  contactCount = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    this.contactService.getContacts(0, 1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.contactCount.set(res.count);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load contacts', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }
}
