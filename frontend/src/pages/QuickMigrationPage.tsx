import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService, documentService } from '../services';
import { useToast } from '../contexts/ToastContext';
import {
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';

interface PatientEntry {
  id: string;
  firstName: string;
  lastName: string;
  files: File[];
  status: 'pending' | 'saving' | 'done' | 'error';
}

export default function QuickMigrationPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<PatientEntry[]>([
    { id: '1', firstName: '', lastName: '', files: [], status: 'pending' },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: Date.now().toString(), firstName: '', lastName: '', files: [], status: 'pending' },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: string, value: any) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleFileChange = (id: string, files: FileList | null) => {
    if (files) {
      updateEntry(id, 'files', Array.from(files));
    }
  };

  const handleSaveAll = async () => {
    const validEntries = entries.filter((e) => e.firstName && e.lastName);

    if (validEntries.length === 0) {
      showToast('Veuillez remplir au moins un patient', 'error');
      return;
    }

    setIsSaving(true);

    for (const entry of validEntries) {
      try {
        // Update status to saving
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: 'saving' } : e))
        );

        // Create patient
        const patient = await patientService.quickCreate(entry.firstName, entry.lastName);

        // Upload files if any
        if (entry.files.length > 0) {
          for (const file of entry.files) {
            await documentService.upload(patient.id, file, 'Document migré', true);
          }
        }

        // Update status to done
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: 'done' } : e))
        );
      } catch (error) {
        // Update status to error
        setEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: 'error' } : e))
        );
      }
    }

    setIsSaving(false);
    showToast('Migration terminée!', 'success');
  };

  const allDone = entries.every((e) => e.status === 'done' || (!e.firstName && !e.lastName));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Migration rapide</h1>
          <p className="text-gray-600">
            Créez rapidement des patients avec leurs documents papier scannés
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-dental-50 border-dental-200">
        <div className="card-body">
          <h3 className="font-semibold text-dental-800 mb-2">Comment ça marche?</h3>
          <ol className="list-decimal list-inside text-sm text-dental-700 space-y-1">
            <li>Entrez le nom du patient</li>
            <li>Uploadez les scans des documents papier existants (optionnel)</li>
            <li>Cliquez sur "Enregistrer tout" pour créer tous les patients</li>
            <li>Vous pourrez compléter les informations plus tard</li>
          </ol>
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`card ${
              entry.status === 'done'
                ? 'border-green-300 bg-green-50'
                : entry.status === 'error'
                ? 'border-red-300 bg-red-50'
                : ''
            }`}
          >
            <div className="card-body">
              <div className="flex items-start gap-4">
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={entry.firstName}
                      onChange={(e) => updateEntry(entry.id, 'firstName', e.target.value)}
                      disabled={entry.status !== 'pending'}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500 disabled:bg-gray-100"
                      placeholder="Prénom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={entry.lastName}
                      onChange={(e) => updateEntry(entry.id, 'lastName', e.target.value)}
                      disabled={entry.status !== 'pending'}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500 focus:border-dental-500 disabled:bg-gray-100"
                      placeholder="Nom"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documents scannés
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {entry.files.length > 0
                          ? `${entry.files.length} fichier(s)`
                          : 'Choisir'}
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        multiple
                        onChange={(e) => handleFileChange(entry.id, e.target.files)}
                        disabled={entry.status !== 'pending'}
                        className="hidden"
                      />
                    </label>
                    {entry.files.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.files.map((file, i) => (
                          <span key={i} className="badge badge-blue">
                            {file.name.substring(0, 15)}...
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {entry.status === 'done' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : entry.status === 'saving' ? (
                    <div className="spinner w-6 h-6" />
                  ) : entry.status === 'error' ? (
                    <span className="text-red-500 text-sm">Erreur</span>
                  ) : (
                    entries.length > 1 && (
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={addEntry}
          disabled={isSaving}
          className="btn btn-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un patient
        </button>

        <div className="flex gap-3">
          <button onClick={() => navigate('/patients')} className="btn btn-secondary">
            {allDone ? 'Terminer' : 'Annuler'}
          </button>
          {!allDone && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <div className="spinner w-5 h-5" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer tout
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

