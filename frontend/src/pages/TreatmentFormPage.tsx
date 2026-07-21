import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { treatmentService, patientService } from '../services';
import type { Patient, TreatmentType } from '../types';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils/errorHandler';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Save,
  Heart,
  User,
  Trash2,
} from 'lucide-react';

export default function TreatmentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const [formData, setFormData] = useState({
    patientId: searchParams.get('patientId') || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    treatmentType: '',
    teethInvolved: '',
    notes: '',
    cost: '',
    amountPaid: '',
    freeText: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const types = await treatmentService.getTypes();
        setTreatmentTypes(types);

        if (isEditMode && id) {
          const record = await treatmentService.getById(id);
          const teeth = record.teethInvolved ? JSON.parse(record.teethInvolved) : [];
          setFormData({
            patientId: record.patientId,
            date: format(new Date(record.date), 'yyyy-MM-dd'),
            treatmentType: record.treatmentType,
            teethInvolved: Array.isArray(teeth) ? teeth.join(', ') : '',
            notes: record.notes || '',
            cost: record.cost != null ? String(record.cost) : '',
            amountPaid: record.amountPaid != null ? String(record.amountPaid) : '',
            freeText: record.freeText || '',
          });
          const patientData = await patientService.getById(record.patientId);
          setPatient(patientData);
        } else if (formData.patientId) {
          const patientData = await patientService.getById(formData.patientId);
          setPatient(patientData);
        }
      } catch (error) {
        showToast(getErrorMessage(error, 'Erreur lors du chargement'), 'error');
        navigate(-1);
      } finally {
        setIsFetching(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const type = await treatmentService.createType(newTypeName.trim());
      setTreatmentTypes((prev) => [...prev, type]);
      setFormData((prev) => ({ ...prev, treatmentType: type.name }));
      setNewTypeName('');
      setShowNewType(false);
    } catch (error) {
      showToast(getErrorMessage(error, "Erreur lors de la création du type"), 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId) {
      showToast('Patient introuvable', 'error');
      return;
    }

    if (!formData.treatmentType) {
      showToast('Veuillez sélectionner un type de soin', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const teethInvolved = formData.teethInvolved
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => parseInt(t, 10))
        .filter((n) => !isNaN(n));

      const payload = {
        patientId: formData.patientId,
        date: new Date(formData.date).toISOString(),
        treatmentType: formData.treatmentType,
        teethInvolved: teethInvolved.length > 0 ? teethInvolved : undefined,
        notes: formData.notes || undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        amountPaid: formData.amountPaid ? parseFloat(formData.amountPaid) : undefined,
        freeText: formData.freeText || undefined,
      };

      if (isEditMode && id) {
        await treatmentService.update(id, payload);
        showToast('Soin mis à jour avec succès', 'success');
      } else {
        await treatmentService.create(payload);
        showToast('Soin créé avec succès', 'success');
      }

      navigate(`/patients/${formData.patientId}`);
    } catch (error: any) {
      const message = getErrorMessage(error, 'Erreur lors de l\'enregistrement');
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Voulez-vous vraiment supprimer ce soin ?')) return;

    try {
      await treatmentService.delete(id);
      showToast('Soin supprimé', 'success');
      navigate(`/patients/${formData.patientId}`);
    } catch (error) {
      showToast(getErrorMessage(error, 'Erreur lors de la suppression'), 'error');
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  const remainingBalance =
    formData.cost && formData.amountPaid
      ? (parseFloat(formData.cost) || 0) - (parseFloat(formData.amountPaid) || 0)
      : formData.cost
      ? parseFloat(formData.cost) || 0
      : null;

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Modifier le soin' : 'Nouveau soin'}
          </h1>
          {patient && (
            <p className="text-gray-600">
              Pour {patient.firstName} {patient.lastName}
            </p>
          )}
        </div>
        {isEditMode && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient info card */}
        {patient && (
          <div className="card">
            <div className="card-body flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-dental-100 flex items-center justify-center">
                <User className="w-5 h-5 text-dental-700" />
              </div>
              <span className="font-medium">
                {patient.firstName} {patient.lastName}
              </span>
            </div>
          </div>
        )}

        {/* Treatment details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5 text-dental-500" />
              Détails du soin
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date du soin *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'acte *
              </label>
              {!showNewType ? (
                <div className="flex gap-2">
                  <select
                    name="treatmentType"
                    value={formData.treatmentType}
                    onChange={handleChange}
                    required
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                  >
                    <option value="">Sélectionner un type</option>
                    {treatmentTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewType(true)}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    + Nouveau type
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Nom du type de soin"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateType}
                    className="btn btn-primary"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewType(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dent(s) concernée(s)
              </label>
              <input
                type="text"
                name="teethInvolved"
                value={formData.teethInvolved}
                onChange={handleChange}
                placeholder="Ex: 11, 12, 21 (numéros séparés par des virgules)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes du praticien
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Coût / Facturation</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coût total (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant payé (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
                />
              </div>
            </div>
            {remainingBalance !== null && (
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-600">Reste à payer</span>
                <span
                  className={`font-semibold ${
                    remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}
                >
                  {remainingBalance.toFixed(2)} DT
                </span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes libres
              </label>
              <textarea
                name="freeText"
                value={formData.freeText}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500"
              />
            </div>
          </div>
        </div>

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
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

