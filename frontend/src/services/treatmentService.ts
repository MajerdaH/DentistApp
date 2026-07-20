import api from './api';
import type { TreatmentRecord, TreatmentFormData, TreatmentType } from '../types';

interface TreatmentSummary {
  totalCost: number;
  totalPaid: number;
  totalRemaining: number;
  recordCount: number;
}

export const treatmentService = {
  async getByPatient(patientId: string): Promise<TreatmentRecord[]> {
    const response = await api.get<TreatmentRecord[]>(`/treatments/patient/${patientId}`);
    return response.data;
  },

  async getById(id: string): Promise<TreatmentRecord> {
    const response = await api.get<TreatmentRecord>(`/treatments/${id}`);
    return response.data;
  },

  async create(data: TreatmentFormData): Promise<TreatmentRecord> {
    const response = await api.post<TreatmentRecord>('/treatments', data);
    return response.data;
  },

  async update(id: string, data: Partial<TreatmentFormData>): Promise<TreatmentRecord> {
    const response = await api.put<TreatmentRecord>(`/treatments/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/treatments/${id}`);
  },

  async getTypes(): Promise<TreatmentType[]> {
    const response = await api.get<TreatmentType[]>('/treatments/types/list');
    return response.data;
  },

  async createType(name: string): Promise<TreatmentType> {
    const response = await api.post<TreatmentType>('/treatments/types', { name });
    return response.data;
  },

  async getSummary(patientId: string): Promise<TreatmentSummary> {
    const response = await api.get<TreatmentSummary>(`/treatments/patient/${patientId}/summary`);
    return response.data;
  },
};

