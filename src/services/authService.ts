import { apiClient } from './apiClient';

export interface AuthUser {
  username: string;
  displayName: string;
  avatarId: string;
  createdAt: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiClient.get<AuthUser>('/api/users/me');
}

export function login(payload: LoginPayload): Promise<AuthUser> {
  return apiClient.post<AuthUser>('/api/auth/login', payload);
}

export function register(payload: RegisterPayload): Promise<AuthUser> {
  return apiClient.post<AuthUser>('/api/auth/register', payload);
}

export function logout(): Promise<void> {
  return apiClient.post<void>('/api/auth/logout');
}
