import api from './api';
import type { AuthResponse, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  },

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'DENTIST' | 'SECRETARY';
  }): Promise<User> {
    const response = await api.post<User>('/auth/users', data);
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/auth/users');
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/auth/users/${id}`);
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isDentist(): boolean {
    const user = this.getUser();
    return user?.role === 'DENTIST';
  },
};

