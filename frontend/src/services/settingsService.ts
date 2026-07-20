import api from './api';
import type { CabinetSettings, DashboardStats, Vacation } from '../types';

export const settingsService = {
  async get(): Promise<CabinetSettings> {
    const response = await api.get<CabinetSettings>('/settings');
    return response.data;
  },

  async update(data: Partial<CabinetSettings>): Promise<CabinetSettings> {
    const response = await api.put<CabinetSettings>('/settings', data);
    return response.data;
  },

  async getDashboard(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/settings/dashboard');
    return response.data;
  },
};

export const vacationService = {
  async getAll(params?: { startDate?: string; endDate?: string; userId?: string }): Promise<Vacation[]> {
    const response = await api.get<Vacation[]>('/vacations', { params });
    return response.data;
  },

  async create(data: { userId: string; startDate: string; endDate: string; reason?: string }): Promise<Vacation> {
    const response = await api.post<Vacation>('/vacations', data);
    return response.data;
  },

  async update(id: string, data: Partial<{ startDate: string; endDate: string; reason: string }>): Promise<Vacation> {
    const response = await api.put<Vacation>(`/vacations/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vacations/${id}`);
  },
};

export const backupService = {
  async downloadBackup(): Promise<Blob> {
    const response = await api.get('/backup/download', {
      responseType: 'blob',
    });
    return response.data;
  },

  async sendEmailBackup(): Promise<void> {
    await api.post('/backup/email');
  },

  async getHistory(): Promise<{ id: string; fileName: string; size: number; createdAt: string }[]> {
    const response = await api.get('/backup/history');
    return response.data;
  },
};

