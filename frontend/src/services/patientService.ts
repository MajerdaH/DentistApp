import api from './api';
import type { Patient, PatientFormData } from '../types';

interface PatientsResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const patientService = {
  async getAll(params?: { search?: string; page?: number; limit?: number }): Promise<PatientsResponse> {
    const response = await api.get<PatientsResponse>('/patients', { params });
    return response.data;
  },

  async getById(id: string): Promise<Patient> {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  async create(data: PatientFormData): Promise<Patient> {
    const response = await api.post<Patient>('/patients', data);
    return response.data;
  },

  async quickCreate(firstName: string, lastName: string): Promise<Patient> {
    const response = await api.post<Patient>('/patients/quick', { firstName, lastName });
    return response.data;
  },

  async update(id: string, data: Partial<PatientFormData>): Promise<Patient> {
    const response = await api.put<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },
};

