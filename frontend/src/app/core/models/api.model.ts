import { User } from './user.model';

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

export interface MessageResponse {
  message: string;
}

export interface DetailResponse {
  detail: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
