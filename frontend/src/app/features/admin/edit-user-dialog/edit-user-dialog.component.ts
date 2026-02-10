import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-edit-user-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit User</h2>
    <mat-dialog-content>
      @if (error) {
        <div class="error-banner">{{ error }}</div>
      }
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
          @if (form.controls.email.hasError('required') && form.controls.email.touched) {
            <mat-error>Email is required</mat-error>
          } @else if (form.controls.email.hasError('email') && form.controls.email.touched) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password" placeholder="Leave empty to keep current" />
          @if (form.controls.password.hasError('minlength') && form.controls.password.touched) {
            <mat-error>Password must be at least 8 characters</mat-error>
          } @else if (form.controls.password.hasError('maxlength') && form.controls.password.touched) {
            <mat-error>Password must be at most 40 characters</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="full_name" />
        </mat-form-field>
        <div class="checkbox-group">
          <mat-checkbox formControlName="is_superuser">Superuser</mat-checkbox>
          <mat-checkbox formControlName="is_active">Active</mat-checkbox>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="submitting"
      >
        {{ submitting ? 'Saving...' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      mat-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 400px;
      }
      .checkbox-group {
        display: flex;
        gap: 16px;
      }
      .error-banner {
        background: #fed7d7;
        color: #c53030;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 16px;
      }
    `,
  ],
})
export class EditUserDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EditUserDialogComponent>);
  private data: User = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  form = this.fb.nonNullable.group({
    email: [this.data.email, [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8), Validators.maxLength(40)]],
    full_name: [this.data.full_name ?? ''],
    is_superuser: [this.data.is_superuser],
    is_active: [this.data.is_active],
  });

  submitting = false;
  error = '';

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = '';
    const { email, password, full_name, is_superuser, is_active } = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      email,
      full_name: full_name || undefined,
      is_superuser,
      is_active,
    };
    if (password) {
      payload['password'] = password;
    }
    this.userService.updateUser(this.data.id, payload).subscribe({
      next: (user) => this.dialogRef.close(user),
      error: (err) => {
        this.error = err.error?.detail || 'Failed to update user';
        this.submitting = false;
      },
    });
  }
}
