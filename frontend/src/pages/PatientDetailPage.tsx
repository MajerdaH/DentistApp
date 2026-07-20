import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientService, documentService } from '../services';
import type { Patient, Document } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Upload,
  Download,
  Eye,
  Plus,
  User,
  Heart,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isDentist } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isLegacyScan, setIsLegacyScan] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'appointments' | 'treatments'>('info');

  useEffect(() => {
    const loadPatient = async () => {
      if (!id) return;
      try {
        const data = await patientService.getById(id);
        setPatient(data);
      } catch (error) {
        showToast('Erreur lors du chargement du patient', 'error');
        navigate('/patients');
      } finally {
        setIsLoading(false);
      }
    };

    loadPatient();
  }, [id]);

  const handleUpload = async () => {
    if (!id || uploadFiles.length === 0) return;
    setIsUploading(true);

    try {
      if (uploadFiles.length === 1) {
        await documentService.upload(id, uploadFiles[0], uploadDescription, isLegacyScan);
      } else {
        await documentService.uploadMultiple(id, uploadFiles, undefined, isLegacyScan);
      }
      showToast('Document(s) uploadé(s) avec succès', 'success');
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadDescription('');
      // Reload patient data
      const data = await patientService.getById(id);
      setPatient(data);
    } catch (error) {
      showToast('Erreur lors de l\'upload', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!id) return;
    try {
      await documentService.delete(docId);
      showToast('Document supprimé', 'success');
      const data = await patientService.getById(id);
      setPatient(data);
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-dental-100 flex items-center justify-center">
              <span className="text-2xl text-dental-700 font-medium">
                {patient.firstName[0]}{patient.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-gray-600">
                Patient depuis {format(new Date(patient.createdAt), 'MMMM yyyy')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/appointments/new?patientId=${patient.id}`}
            className="btn btn-secondary"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Nouveau RDV
          </Link>
          <Link to={`/patients/${patient.id}/edit`} className="btn btn-primary">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[
            { id: 'info', label: 'Informations', icon: User },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
            ...(isDentist ? [{ id: 'treatments', label: 'Soins', icon: Heart }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-dental-500 text-dental-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Coordonnées</h2>
            </div>
            <div className="card-body space-y-4">
              {patient.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{patient.address}</span>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>{format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Additional info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Informations complémentaires</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">CNAM</span>
                <span className={`badge ${patient.cnam ? 'badge-green' : 'badge-gray'}`}>
                  {patient.cnam ? 'Oui' : 'Non'}
                </span>
              </div>
              {patient.treatingDoctor && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Médecin traitant</span>
                  <span>{patient.treatingDoctor}</span>
                </div>
              )}
              {patient.emergencyContact && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Contact d'urgence</span>
                  <span>{patient.emergencyContact}</span>
                </div>
              )}
            </div>
          </div>

          {/* Medical info - Dentist only */}
          {isDentist && (
            <>
              {patient.allergies && (
                <div className="card border-red-200">
                  <div className="card-header bg-red-50">
                    <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Allergies / Maladies
                    </h2>
                  </div>
                  <div className="card-body">
                    <p className="whitespace-pre-wrap">{patient.allergies}</p>
                  </div>
                </div>
              )}
              {patient.notes && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-semibold">Notes</h2>
                  </div>
                  <div className="card-body">
                    <p className="whitespace-pre-wrap">{patient.notes}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Documents</h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter
            </button>
          </div>
          <div className="card-body">
            {patient.documents && patient.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {patient.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-dental-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="w-8 h-8 text-dental-500" />
                      <div className="flex gap-1">
                        <a
                          href={documentService.getFileUrl(doc.filePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{doc.fileName}</p>
                    {doc.description && (
                      <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge badge-blue">{doc.fileType.toUpperCase()}</span>
                      {doc.isLegacyScan && (
                        <span className="badge badge-yellow">Archive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Aucun document</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Rendez-vous</h2>
            <Link
              to={`/appointments/new?patientId=${patient.id}`}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau RDV
            </Link>
          </div>
          <div className="card-body p-0">
            {patient.appointments && patient.appointments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {patient.appointments.map((apt) => (
                  <Link
                    key={apt.id}
                    to={`/appointments/${apt.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-dental-50 flex flex-col items-center justify-center">
                      <span className="text-xs text-dental-600 font-medium">
                        {format(new Date(apt.startTime), 'MMM')}
                      </span>
                      <span className="text-lg font-bold text-dental-700">
                        {format(new Date(apt.startTime), 'd')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{apt.appointmentType}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(apt.startTime), 'HH:mm')} - {apt.duration} min
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        apt.status === 'COMPLETED'
                          ? 'badge-green'
                          : apt.status === 'CANCELLED'
                          ? 'badge-red'
                          : apt.status === 'NO_SHOW'
                          ? 'badge-yellow'
                          : 'badge-blue'
                      }`}
                    >
                      {apt.status === 'SCHEDULED'
                        ? 'Planifié'
                        : apt.status === 'COMPLETED'
                        ? 'Terminé'
                        : apt.status === 'CANCELLED'
                        ? 'Annulé'
                        : 'Absent'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Aucun rendez-vous</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'treatments' && isDentist && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Historique des soins</h2>
            <Link
              to={`/treatments/new?patientId=${patient.id}`}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau soin
            </Link>
          </div>
          <div className="card-body p-0">
            {patient.treatmentRecords && patient.treatmentRecords.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {patient.treatmentRecords.map((treatment) => (
                  <Link
                    key={treatment.id}
                    to={`/treatments/${treatment.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{treatment.treatmentType}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(treatment.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      {treatment.cost && (
                        <p className="font-medium text-gray-900">{treatment.cost} TND</p>
                      )}
                      {treatment.remainingBalance && treatment.remainingBalance > 0 && (
                        <p className="text-sm text-red-500">
                          Reste: {treatment.remainingBalance} TND
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Aucun soin enregistré</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ajouter un document
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier(s)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  multiple
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF, PNG, JPG acceptés (max 10MB)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                  placeholder="Description du document..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLegacy"
                  checked={isLegacyScan}
                  onChange={(e) => setIsLegacyScan(e.target.checked)}
                  className="rounded text-dental-500"
                />
                <label htmlFor="isLegacy" className="text-sm text-gray-700">
                  Document migré (scan de papier existant)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || isUploading}
                className="btn btn-primary"
              >
                {isUploading ? (
                  <div className="spinner w-5 h-5" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Uploader
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

