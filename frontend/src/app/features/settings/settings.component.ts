import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthStore } from '../../core/state/auth.store';
import { UserService } from '../../core/services/user.service';

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
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="profileSubmitting">
              {{ profileSubmitting ? 'Saving...' : 'Save' }}
            </button>
          </form>
        </div>
      </mat-tab>

      <mat-tab label="Password">
        <div class="tab-content">
          @if (passwordError) {
            <div class="error-banner">{{ passwordError }}</div>
          }
          <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Current Password</mat-label>
              <input matInput formControlName="current_password" type="password" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input matInput formControlName="new_password" type="password" />
              @if (passwordForm.controls.new_password.hasError('minlength') && passwordForm.controls.new_password.touched) {
                <mat-error>Must be at least 8 characters</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm New Password</mat-label>
              <input matInput formControlName="confirm_password" type="password" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="passwordSubmitting">
              {{ passwordSubmitting ? 'Changing...' : 'Change Password' }}
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
            <button mat-raised-button color="warn" (click)="deleteAccount()" [disabled]="deleteSubmitting">
              {{ deleteSubmitting ? 'Deleting...' : 'Delete Account' }}
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
    .error-banner { background: #fed7d7; color: #c53030; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
    .danger { color: #c53030; }
  `]
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  authStore = inject(AuthStore);

  profileForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['']
  });

  passwordForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(40)]],
    confirm_password: ['', Validators.required]
  });

  profileSubmitting = false;
  passwordSubmitting = false;
  deleteSubmitting = false;
  passwordError = '';

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
    this.profileSubmitting = true;
    const { email, full_name } = this.profileForm.getRawValue();
    this.userService.updateMe({ email, full_name: full_name || undefined }).subscribe({
      next: user => {
        this.authStore.setUser(user);
        this.snackBar.open('Profile updated', 'Close', { duration: 3000 });
        this.profileSubmitting = false;
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Update failed', 'Close', { duration: 3000 });
        this.profileSubmitting = false;
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;
    const { current_password, new_password, confirm_password } = this.passwordForm.getRawValue();
    if (new_password !== confirm_password) {
      this.passwordError = 'Passwords do not match';
      return;
    }
    this.passwordSubmitting = true;
    this.passwordError = '';
    this.userService.updatePassword({ current_password, new_password }).subscribe({
      next: () => {
        this.snackBar.open('Password changed', 'Close', { duration: 3000 });
        this.passwordForm.reset();
        this.passwordSubmitting = false;
      },
      error: err => {
        this.passwordError = err.error?.detail || 'Password change failed';
        this.passwordSubmitting = false;
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    this.deleteSubmitting = true;
    this.userService.deleteMe().subscribe({
      next: () => {
        this.authStore.clearAuth();
        this.router.navigate(['/login']);
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Delete failed', 'Close', { duration: 3000 });
        this.deleteSubmitting = false;
      }
    });
  }
}
