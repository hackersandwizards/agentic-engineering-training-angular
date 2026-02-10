import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/state/auth.store';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="center">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>Sign In</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (error()) {
            <div class="error-banner">{{ error() }}</div>
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
              }
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="submitting()">
              {{ submitting() ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
          <p class="link">Don't have an account? <a routerLink="/signup">Sign up</a></p>
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submitting = signal(false);
  error = signal('');

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.authStore.setAuth(res.access_token, res.user);
        this.router.navigate(['/']);
      },
      error: err => {
        this.error.set(err.error?.detail || 'Login failed');
        this.submitting.set(false);
      }
    });
  }
}
