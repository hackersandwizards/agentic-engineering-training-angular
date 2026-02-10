import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-delete-user-dialog',
  imports: [MatDialogModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete User</h2>
    <mat-dialog-content>
      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }
      <p>Are you sure you want to delete <strong>{{ user.email }}</strong>?</p>
      <p class="warning">This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button
        mat-raised-button
        color="warn"
        (click)="onConfirm()"
        [disabled]="submitting()"
      >
        {{ submitting() ? 'Deleting...' : 'Delete' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 350px;
      }
      .warning {
        color: #c53030;
        font-size: 0.875rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteUserDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeleteUserDialogComponent>);
  readonly user: User = inject(MAT_DIALOG_DATA);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  submitting = signal(false);
  error = signal('');

  onConfirm(): void {
    this.submitting.set(true);
    this.error.set('');
    this.userService.deleteUser(this.user.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.error.set(err.error?.detail || 'Failed to delete user');
        this.submitting.set(false);
      },
    });
  }
}
