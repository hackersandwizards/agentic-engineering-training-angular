import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _token = signal<string | null>(localStorage.getItem('token'));
  private readonly _user = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isSuperuser = computed(() => this._user()?.is_superuser ?? false);

  setAuth(token: string, user: User): void {
    localStorage.setItem('token', token);
    this._token.set(token);
    this._user.set(user);
  }

  setUser(user: User): void {
    this._user.set(user);
  }

  clearAuth(): void {
    localStorage.removeItem('token');
    this._token.set(null);
    this._user.set(null);
  }
}
