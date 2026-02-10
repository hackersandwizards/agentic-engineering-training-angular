import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Contact } from '../models/contact.model';

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private http: HttpClient) {}

  getContacts(skip: number, limit: number): Observable<PaginatedResponse<Contact>> {
    return this.http.get<PaginatedResponse<Contact>>(`/api/v1/contacts?skip=${skip}&limit=${limit}`);
  }

  createContact(data: { organisation: string; description?: string }): Observable<Contact> {
    return this.http.post<Contact>('/api/v1/contacts', data);
  }

  getContact(id: string): Observable<Contact> {
    return this.http.get<Contact>(`/api/v1/contacts/${id}`);
  }

  updateContact(id: string, data: { organisation?: string; description?: string }): Observable<Contact> {
    return this.http.patch<Contact>(`/api/v1/contacts/${id}`, data);
  }

  deleteContact(id: string): Observable<any> {
    return this.http.delete(`/api/v1/contacts/${id}`);
  }
}
