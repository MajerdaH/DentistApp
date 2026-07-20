import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientService } from '../services';
import type { Patient } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Search,
  Plus,
  ChevronRight,
  User,
  Phone,
  Mail,
  Trash2,
  FileText,
  Calendar,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

export default function PatientsPage() {
  const { isDentist } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadPatients = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const response = await patientService.getAll({ page, limit: 20, search });
      setPatients(response.patients);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (error) {
      showToast('Erreur lors du chargement des patients', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients(1, searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      await patientService.delete(id);
      showToast('Patient supprimé avec succès', 'success');
      loadPatients(currentPage, searchTerm);
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">Gérer la liste des patients</p>
        </div>
        <div className="flex gap-3">
          <Link to="/patients/new" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau patient
          </Link>
          <Link to="/patients/quick" className="btn btn-secondary">
            <FileText className="w-4 h-4 mr-2" />
            Migration rapide
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
          />
        </div>
      </div>

      {/* Patient list */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="spinner w-10 h-10" />
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun patient trouvé</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? 'Essayez une autre recherche'
                : 'Commencez par ajouter votre premier patient'}
            </p>
            <Link to="/patients/new" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un patient
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNAM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statistiques
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-dental-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-dental-700 font-medium">
                              {patient.firstName[0]}{patient.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </p>
                            {patient.dateOfBirth && (
                              <p className="text-sm text-gray-500">
                                {format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {patient.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {patient.phone}
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              {patient.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`badge ${
                            patient.cnam ? 'badge-green' : 'badge-gray'
                          }`}
                        >
                          {patient.cnam ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {patient._count?.appointments || 0} RDV
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {patient._count?.documents || 0} docs
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isDentist && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(patient.id);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => loadPatients(page, searchTerm)}
                    className={`w-10 h-10 rounded-lg ${
                      page === currentPage
                        ? 'bg-dental-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce patient? Cette action est irréversible
              et supprimera également tous les rendez-vous et documents associés.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteId)} className="btn btn-danger">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

