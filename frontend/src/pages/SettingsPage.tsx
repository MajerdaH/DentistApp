import React, { useEffect, useState } from 'react';
import { settingsService, backupService, authService, vacationService } from '../services';
import type { CabinetSettings, User, Vacation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import {
  Save,
  Download,
  Mail,
  Building,
  Clock,
  Users,
  Plus,
  Trash2,
  Calendar,
  Shield,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<CabinetSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cabinet' | 'users' | 'vacations' | 'backup'>('cabinet');

  // New user form
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'SECRETARY' as 'DENTIST' | 'SECRETARY',
  });

  // New vacation form
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [newVacation, setNewVacation] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, usersData, vacationsData] = await Promise.all([
          settingsService.get(),
          authService.getUsers(),
          vacationService.getAll(),
        ]);
        setSettings(settingsData);
        setUsers(usersData);
        setVacations(vacationsData);
      } catch (error) {
        showToast('Erreur lors du chargement', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await settingsService.update(settings);
      showToast('Paramètres enregistrés', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'enregistrement', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await authService.createUser(newUser);
      showToast('Utilisateur créé', 'success');
      setShowUserForm(false);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'SECRETARY' });
      const usersData = await authService.getUsers();
      setUsers(usersData);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors de la création';
      showToast(message, 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await authService.deleteUser(id);
      showToast('Utilisateur supprimé', 'success');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleCreateVacation = async () => {
    try {
      await vacationService.create(newVacation);
      showToast('Vacances ajoutées', 'success');
      setShowVacationForm(false);
      setNewVacation({ userId: '', startDate: '', endDate: '', reason: '' });
      const vacationsData = await vacationService.getAll();
      setVacations(vacationsData);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors de la création';
      showToast(message, 'error');
    }
  };

  const handleDeleteVacation = async (id: string) => {
    try {
      await vacationService.delete(id);
      showToast('Vacances supprimées', 'success');
      setVacations((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleDownloadBackup = async () => {
    try {
      showToast('Préparation de la sauvegarde...', 'info');
      const blob = await backupService.downloadBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Sauvegarde téléchargée', 'success');
    } catch (error) {
      showToast('Erreur lors du téléchargement', 'error');
    }
  };

  const handleEmailBackup = async () => {
    try {
      await backupService.sendEmailBackup();
      showToast('Sauvegarde envoyée par email', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'envoi (vérifiez la configuration email)', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Configuration du cabinet</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {[
            { id: 'cabinet', label: 'Cabinet', icon: Building },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'vacations', label: 'Vacances', icon: Calendar },
            { id: 'backup', label: 'Sauvegarde', icon: Shield },
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

      {/* Cabinet Settings */}
      {activeTab === 'cabinet' && settings && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Informations du cabinet</h2>
          </div>
          <div className="card-body space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du cabinet
                </label>
                <input
                  type="text"
                  value={settings.cabinetName || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev!, cabinetName: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500"
                  placeholder="Cabinet Dentaire Dr..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={settings.phone || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev!, phone: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev!, email: e.target.value }))
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <textarea
                  value={settings.address || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev!, address: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dental-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveSettings} disabled={isSaving} className="btn btn-primary">
                {isSaving ? (
                  <div className="spinner w-5 h-5" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Management */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Utilisateurs</h2>
            <button onClick={() => setShowUserForm(true)} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </button>
          </div>
          <div className="card-body p-0">
            <div className="divide-y divide-gray-100">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-dental-100 flex items-center justify-center">
                      <span className="text-dental-700 font-medium">
                        {u.firstName[0]}{u.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${u.role === 'DENTIST' ? 'badge-blue' : 'badge-gray'}`}>
                      {u.role === 'DENTIST' ? 'Dentiste' : 'Secrétaire'}
                    </span>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vacations */}
      {activeTab === 'vacations' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vacances / Absences</h2>
            <button onClick={() => setShowVacationForm(true)} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </button>
          </div>
          <div className="card-body p-0">
            {vacations.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {vacations.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {v.user?.firstName} {v.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(v.startDate), 'dd/MM/yyyy')} -{' '}
                        {format(new Date(v.endDate), 'dd/MM/yyyy')}
                      </p>
                      {v.reason && <p className="text-sm text-gray-400">{v.reason}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteVacation(v.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Aucune période de vacances planifiée
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backup */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Sauvegarde des données</h2>
            </div>
            <div className="card-body space-y-4">
              <p className="text-gray-600">
                Téléchargez une sauvegarde complète de vos données (base de données + documents).
              </p>
              <div className="flex gap-3">
                <button onClick={handleDownloadBackup} className="btn btn-primary">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger la sauvegarde
                </button>
                <button onClick={handleEmailBackup} className="btn btn-secondary">
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer par email
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 border-yellow-200">
            <div className="card-body">
              <h3 className="font-semibold text-yellow-800 mb-2">Sauvegarde automatique</h3>
              <p className="text-sm text-yellow-700">
                Une sauvegarde automatique est envoyée par email tous les jours à 2h du matin.
                Configurez votre email dans le fichier .env du backend.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {showUserForm && (
        <div className="modal-overlay" onClick={() => setShowUserForm(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Nouvel utilisateur</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                >
                  <option value="SECRETARY">Secrétaire</option>
                  <option value="DENTIST">Dentiste</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowUserForm(false)} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={handleCreateUser} className="btn btn-primary">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Vacation Modal */}
      {showVacationForm && (
        <div className="modal-overlay" onClick={() => setShowVacationForm(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Nouvelle période de vacances</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utilisateur</label>
                <select
                  value={newVacation.userId}
                  onChange={(e) => setNewVacation((prev) => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                >
                  <option value="">Sélectionner...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                  <input
                    type="date"
                    value={newVacation.startDate}
                    onChange={(e) => setNewVacation((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                  <input
                    type="date"
                    value={newVacation.endDate}
                    onChange={(e) => setNewVacation((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison (optionnel)</label>
                <input
                  type="text"
                  value={newVacation.reason}
                  onChange={(e) => setNewVacation((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="Vacances d'été, formation..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowVacationForm(false)} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={handleCreateVacation} className="btn btn-primary">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

