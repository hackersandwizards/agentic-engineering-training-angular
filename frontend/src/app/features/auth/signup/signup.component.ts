import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="center">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (error) {
            <div class="error-banner">{{ error }}</div>
          }
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" />
              @if (form.controls.email.hasError('required') && form.controls.email.touched) {
                <mat-error>Email is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" type="password" />
              @if (form.controls.password.hasError('minlength') && form.controls.password.touched) {
                <mat-error>Password must be at least 8 characters</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput formControlName="confirm_password" type="password" />
              @if (form.controls.confirm_password.hasError('passwordMismatch') && form.controls.confirm_password.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="submitting">
              {{ submitting ? 'Creating account...' : 'Sign Up' }}
            </button>
          </form>
          <p class="link">Already have an account? <a routerLink="/login">Sign in</a></p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .center { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f7fafc; }
    .card { width: 400px; padding: 24px; }
    .full-width { width: 100%; }
    .error-banner { background: #fed7d7; color: #c53030; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
    .link { text-align: center; margin-top: 16px; }
    .link a { color: #3182ce; }
  `]
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    full_name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(40)]],
    confirm_password: ['', [Validators.required, this.matchPassword.bind(this)]]
  });

  submitting = false;
  error = '';

  matchPassword(control: AbstractControl): ValidationErrors | null {
    if (this.form && control.value !== this.form.controls.password.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = '';
    const { email, password, full_name } = this.form.getRawValue();
    this.authService.signup({ email, password, full_name: full_name || undefined }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: err => {
        this.error = err.error?.detail || 'Signup failed';
        this.submitting = false;
      }
    });
  }
}
