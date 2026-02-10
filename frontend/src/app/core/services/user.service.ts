import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { MessageResponse, PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getMe(): Observable<User> {
    return this.http.get<User>('/api/v1/users/me');
  }

  updateMe(data: { email?: string; full_name?: string }): Observable<User> {
    return this.http.patch<User>('/api/v1/users/me', data);
  }

  updatePassword(data: { current_password: string; new_password: string }): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>('/api/v1/users/me/password', data);
  }

  deleteMe(): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>('/api/v1/users/me');
  }

  getUsers(skip: number, limit: number): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(`/api/v1/users?skip=${skip}&limit=${limit}`);
  }

  createUser(data: { email: string; password: string; full_name?: string; is_superuser?: boolean }): Observable<User> {
    return this.http.post<User>('/api/v1/users', data);
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/v1/users/${id}`);
  }

  updateUser(id: string, data: { email?: string; password?: string; full_name?: string; is_superuser?: boolean; is_active?: boolean }): Observable<User> {
    return this.http.patch<User>(`/api/v1/users/${id}`, data);
  }

  deleteUser(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`/api/v1/users/${id}`);
  }
}
