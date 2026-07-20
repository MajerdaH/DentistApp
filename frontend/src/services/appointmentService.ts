import api from './api';
import type { Appointment, AppointmentFormData, AppointmentType } from '../types';

export const appointmentService = {
  async getAll(params?: {
    startDate?: string;
    endDate?: string;
    patientId?: string;
    status?: string;
  }): Promise<Appointment[]> {
    const response = await api.get<Appointment[]>('/appointments', { params });
    return response.data;
  },

  async getById(id: string): Promise<Appointment> {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  async getToday(): Promise<Appointment[]> {
    const response = await api.get<Appointment[]>('/appointments/today/list');
    return response.data;
  },

  async create(data: AppointmentFormData): Promise<Appointment> {
    const response = await api.post<Appointment>('/appointments', data);
    return response.data;
  },

  async update(id: string, data: Partial<AppointmentFormData> & { status?: string }): Promise<Appointment> {
    const response = await api.put<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },

  async getTypes(): Promise<AppointmentType[]> {
    const response = await api.get<AppointmentType[]>('/appointments/types/list');
    return response.data;
  },

  async createType(name: string, color?: string): Promise<AppointmentType> {
    const response = await api.post<AppointmentType>('/appointments/types', { name, color });
    return response.data;
  },
};

