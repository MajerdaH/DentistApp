import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/errorHandler';
import { ArrowLeft, Save, User } from 'lucide-react';

export default function PatientFormPage() {
  const { isDentist } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    cnam: false,
    treatingDoctor: '',
    emergencyContact: '',
    allergies: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const patient = await patientService.create(formData);
      showToast('Patient créé avec succès', 'success');
      navigate(`/patients/${patient.id}`);
    } catch (error: any) {
      const message = getErrorMessage(error, 'Erreur lors de la création');
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau patient</h1>
          <p className="text-gray-600">Remplissez les informations du patient</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-dental-500" />
              Informations personnelles
            </h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNAM
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="cnam"
                    checked={formData.cnam === true}
                    onChange={() => setFormData((prev) => ({ ...prev, cnam: true }))}
                    className="text-dental-500 focus:ring-dental-500"
                  />
                  <span>Oui</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="cnam"
                    checked={formData.cnam === false}
                    onChange={() => setFormData((prev) => ({ ...prev, cnam: false }))}
                    className="text-dental-500 focus:ring-dental-500"
                  />
                  <span>Non</span>
                </label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médecin traitant
              </label>
              <input
                type="text"
                name="treatingDoctor"
                value={formData.treatingDoctor}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact d'urgence
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>
          </div>
        </div>

        {/* Medical Info - Only for Dentist */}
        {isDentist && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                Informations médicales
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Visible uniquement par le dentiste
              </p>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies / Maladies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                  placeholder="Listez les allergies et maladies connues..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autres notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                  placeholder="Notes additionnelles..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            Annuler
          </button>
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? (
              <div className="spinner w-5 h-5" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Créer le patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

