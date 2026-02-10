import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
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
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-add-user-dialog',
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
    <h2 mat-dialog-title>Create User</h2>
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
          <input matInput formControlName="password" type="password" />
          @if (form.controls.password.hasError('required') && form.controls.password.touched) {
            <mat-error>Password is required</mat-error>
          } @else if (form.controls.password.hasError('minlength') && form.controls.password.touched) {
            <mat-error>Password must be at least 8 characters</mat-error>
          } @else if (form.controls.password.hasError('maxlength') && form.controls.password.touched) {
            <mat-error>Password must be at most 40 characters</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Full Name</mat-label>
          <input matInput formControlName="full_name" />
        </mat-form-field>
        <mat-checkbox formControlName="is_superuser">Superuser</mat-checkbox>
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
        {{ submitting ? 'Creating...' : 'Create' }}
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
export class AddUserDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AddUserDialogComponent>);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(40)]],
    full_name: [''],
    is_superuser: [false],
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
    const { email, password, full_name, is_superuser } = this.form.getRawValue();
    this.userService
      .createUser({ email, password, full_name: full_name || undefined, is_superuser })
      .subscribe({
        next: (user) => this.dialogRef.close(user),
        error: (err) => {
          this.error = err.error?.detail || 'Failed to create user';
          this.submitting = false;
        },
      });
  }
}
