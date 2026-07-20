import api from './api';
import type { Document } from '../types';

export const documentService = {
  async getByPatient(patientId: string): Promise<Document[]> {
    const response = await api.get<Document[]>(`/documents/patient/${patientId}`);
    return response.data;
  },

  async getById(id: string): Promise<Document> {
    const response = await api.get<Document>(`/documents/${id}`);
    return response.data;
  },

  async upload(patientId: string, file: File, description?: string, isLegacyScan?: boolean): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    if (isLegacyScan) formData.append('isLegacyScan', 'true');

    const response = await api.post<Document>(`/documents/patient/${patientId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadMultiple(patientId: string, files: File[], descriptions?: string[], isLegacyScan?: boolean): Promise<Document[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (descriptions) {
      descriptions.forEach((desc) => {
        formData.append('descriptions', desc);
      });
    }
    if (isLegacyScan) formData.append('isLegacyScan', 'true');

    const response = await api.post<Document[]>(`/documents/patient/${patientId}/multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateDescription(id: string, description: string): Promise<Document> {
    const response = await api.put<Document>(`/documents/${id}`, { description });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  getDownloadUrl(id: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    return `${baseUrl}/documents/${id}/download`;
  },

  getFileUrl(filePath: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}${filePath}`;
  },
};

