import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { matchPasswordValidator } from '../../../core/validators/match-password.validator';
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
          @if (error()) {
            <div class="error-banner">{{ error() }}</div>
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
              <mat-label>Confirm Password</mat-label>
              <input matInput formControlName="confirm_password" type="password" />
              @if (form.controls.confirm_password.hasError('required') && form.controls.confirm_password.touched) {
                <mat-error>Confirm password is required</mat-error>
              } @else if (form.controls.confirm_password.hasError('passwordMismatch') && form.controls.confirm_password.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="submitting()">
              {{ submitting() ? 'Creating account...' : 'Sign Up' }}
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
    .link { text-align: center; margin-top: 16px; }
    .link a { color: #3182ce; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  form = this.fb.nonNullable.group({
    full_name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(40)]],
    confirm_password: ['', Validators.required]
  }, { validators: matchPasswordValidator('password', 'confirm_password') });

  submitting = signal(false);
  error = signal('');

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    const { email, password, full_name } = this.form.getRawValue();
    this.authService.signup({ email, password, full_name: full_name || undefined }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: err => {
        this.error.set(err.error?.detail || 'Signup failed');
        this.submitting.set(false);
      }
    });
  }
}
