import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/v1/login/access-token', { email, password });
  }

  testToken(): Observable<User> {
    return this.http.post<User>('/api/v1/login/test-token', {});
  }

  signup(data: { email: string; password: string; full_name?: string }): Observable<User> {
    return this.http.post<User>('/api/v1/users/signup', data);
  }
}
