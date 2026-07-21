import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appointmentService, patientService } from '../services';
import type { Patient, AppointmentType } from '../types';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/errorHandler';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  User,
  Search,
} from 'lucide-react';

export default function AppointmentFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  const initialDate = searchParams.get('date')
    ? new Date(searchParams.get('date')!)
    : new Date();

  const [formData, setFormData] = useState({
    patientId: searchParams.get('patientId') || '',
    patientName: '',
    date: format(initialDate, 'yyyy-MM-dd'),
    time: format(initialDate, 'HH:mm'),
    duration: 30,
    appointmentType: '',
    notes: '',
    color: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsData, typesData] = await Promise.all([
          patientService.getAll({ limit: 100 }),
          appointmentService.getTypes(),
        ]);
        setPatients(patientsData.patients);
        setAppointmentTypes(typesData);

        // If patientId is provided, find the patient name
        if (searchParams.get('patientId')) {
          const patient = patientsData.patients.find(
            (p) => p.id === searchParams.get('patientId')
          );
          if (patient) {
            setFormData((prev) => ({
              ...prev,
              patientName: `${patient.firstName} ${patient.lastName}`,
            }));
          }
        }
      } catch (error) {
        showToast('Erreur lors du chargement', 'error');
      }
    };

    loadData();
  }, []);

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectPatient = (patient: Patient) => {
    setFormData((prev) => ({
      ...prev,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
    }));
    setShowPatientSearch(false);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId) {
      showToast('Veuillez sélectionner un patient', 'error');
      return;
    }

    if (!formData.appointmentType) {
      showToast('Veuillez sélectionner un type de rendez-vous', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const startTime = new Date(`${formData.date}T${formData.time}`);

      await appointmentService.create({
        patientId: formData.patientId,
        startTime: startTime.toISOString(),
        duration: formData.duration,
        appointmentType: formData.appointmentType,
        notes: formData.notes,
        color: formData.color || undefined,
      });

      showToast('Rendez-vous créé avec succès', 'success');
      navigate('/calendar');
    } catch (error: any) {
      const message = getErrorMessage(error, 'Erreur lors de la création');
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau rendez-vous</h1>
          <p className="text-gray-600">Planifier un rendez-vous patient</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-dental-500" />
              Patient
            </h2>
          </div>
          <div className="card-body">
            <div className="relative">
              {formData.patientId ? (
                <div className="flex items-center justify-between p-3 bg-dental-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dental-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-dental-700" />
                    </div>
                    <span className="font-medium">{formData.patientName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, patientId: '', patientName: '' }))
                    }
                    className="text-sm text-dental-600 hover:text-dental-700"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un patient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setShowPatientSearch(true)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                    />
                  </div>
                  {showPatientSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => handleSelectPatient(patient)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-dental-100 flex items-center justify-center">
                              <span className="text-sm text-dental-700 font-medium">
                                {patient.firstName[0]}{patient.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {patient.firstName} {patient.lastName}
                              </p>
                              {patient.phone && (
                                <p className="text-sm text-gray-500">{patient.phone}</p>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          Aucun patient trouvé
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-dental-500" />
              Date et heure
            </h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heure <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                min="08:00"
                max="18:00"
                step="900"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (minutes) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) }))
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h30</option>
                <option value={120}>2 heures</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointment Type */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-dental-500" />
              Type de rendez-vous
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {appointmentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      appointmentType: type.name,
                      color: type.color || '',
                    }))
                  }
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    formData.appointmentType === type.name
                      ? 'border-dental-500 bg-dental-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {type.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                    )}
                    <span className="font-medium">{type.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-body">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              placeholder="Notes pour ce rendez-vous..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? (
              <div className="spinner w-5 h-5" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Créer le rendez-vous
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

