import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { matchPasswordValidator } from '../../core/validators/match-password.validator';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '../../core/state/auth.store';
import { UserService } from '../../core/services/user.service';
import { DeleteAccountDialogComponent } from './delete-account-dialog/delete-account-dialog.component';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h1>Settings</h1>
    <mat-tab-group>
      <mat-tab label="Profile">
        <div class="tab-content">
          <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" />
              @if (profileForm.controls.email.hasError('required') && profileForm.controls.email.touched) {
                <mat-error>Email is required</mat-error>
              } @else if (profileForm.controls.email.hasError('email') && profileForm.controls.email.touched) {
                <mat-error>Enter a valid email</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="profileSubmitting()">
              {{ profileSubmitting() ? 'Saving...' : 'Save' }}
            </button>
          </form>
        </div>
      </mat-tab>

      <mat-tab label="Password">
        <div class="tab-content">
          @if (passwordError()) {
            <div class="error-banner">{{ passwordError() }}</div>
          }
          <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Current Password</mat-label>
              <input matInput formControlName="current_password" type="password" />
              @if (passwordForm.controls.current_password.hasError('required') && passwordForm.controls.current_password.touched) {
                <mat-error>Current password is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input matInput formControlName="new_password" type="password" />
              @if (passwordForm.controls.new_password.hasError('required') && passwordForm.controls.new_password.touched) {
                <mat-error>New password is required</mat-error>
              } @else if (passwordForm.controls.new_password.hasError('minlength') && passwordForm.controls.new_password.touched) {
                <mat-error>Must be at least 8 characters</mat-error>
              } @else if (passwordForm.controls.new_password.hasError('maxlength') && passwordForm.controls.new_password.touched) {
                <mat-error>Must be at most 40 characters</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm New Password</mat-label>
              <input matInput formControlName="confirm_password" type="password" />
              @if (passwordForm.controls.confirm_password.hasError('required') && passwordForm.controls.confirm_password.touched) {
                <mat-error>Confirm password is required</mat-error>
              } @else if (passwordForm.controls.confirm_password.hasError('passwordMismatch') && passwordForm.controls.confirm_password.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="passwordSubmitting()">
              {{ passwordSubmitting() ? 'Changing...' : 'Change Password' }}
            </button>
          </form>
        </div>
      </mat-tab>

      <mat-tab label="Danger Zone">
        <div class="tab-content danger">
          @if (authStore.isSuperuser()) {
            <p>Superusers cannot delete their own account.</p>
          } @else {
            <p>Once you delete your account, there is no going back.</p>
            <button mat-raised-button color="warn" (click)="deleteAccount()" [disabled]="deleteSubmitting()">
              {{ deleteSubmitting() ? 'Deleting...' : 'Delete Account' }}
            </button>
          }
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    h1 { margin-bottom: 16px; }
    .tab-content { padding: 24px 0; max-width: 500px; }
    .full-width { width: 100%; }
    .danger { color: #c53030; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  authStore = inject(AuthStore);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  profileForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['']
  });

  passwordForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(40)]],
    confirm_password: ['', Validators.required]
  }, { validators: matchPasswordValidator('new_password', 'confirm_password') });

  profileSubmitting = signal(false);
  passwordSubmitting = signal(false);
  deleteSubmitting = signal(false);
  passwordError = signal('');

  ngOnInit(): void {
    const user = this.authStore.user();
    if (user) {
      this.profileForm.patchValue({
        email: user.email,
        full_name: user.full_name || ''
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    this.profileSubmitting.set(true);
    const { email, full_name } = this.profileForm.getRawValue();
    this.userService.updateMe({ email, full_name }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        this.authStore.setUser(user);
        this.snackBar.open('Profile updated', 'Close', { duration: 3000 });
        this.profileSubmitting.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Update failed', 'Close', { duration: 3000 });
        this.profileSubmitting.set(false);
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { current_password, new_password } = this.passwordForm.getRawValue();
    this.passwordSubmitting.set(true);
    this.passwordError.set('');
    this.userService.updatePassword({ current_password, new_password }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open('Password changed', 'Close', { duration: 3000 });
        this.passwordForm.reset();
        this.passwordSubmitting.set(false);
      },
      error: err => {
        this.passwordError.set(err.error?.detail || 'Password change failed');
        this.passwordSubmitting.set(false);
      }
    });
  }

  deleteAccount(): void {
    const ref = this.dialog.open(DeleteAccountDialogComponent, { width: '400px' });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (!confirmed) return;
      this.deleteSubmitting.set(true);
      this.userService.deleteMe().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.authStore.clearAuth();
          this.router.navigate(['/login']);
        },
        error: err => {
          this.snackBar.open(err.error?.detail || 'Delete failed', 'Close', { duration: 3000 });
          this.deleteSubmitting.set(false);
        }
      });
    });
  }
}
