import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../services';
import type { Appointment } from '../types';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar,
  Plus,
  Clock,
  User,
  ChevronRight,
  Filter,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export default function AppointmentsPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const data = await appointmentService.getAll({
        startDate: today.toISOString(),
      });
      setAppointments(data);
    } catch (error) {
      showToast('Erreur lors du chargement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await appointmentService.update(id, { status });
      showToast('Statut mis à jour', 'success');
      loadAppointments();
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'CANCELLED':
        return <X className="w-4 h-4 text-red-500" />;
      case 'NO_SHOW':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Terminé';
      case 'CANCELLED':
        return 'Annulé';
      case 'NO_SHOW':
        return 'Absent';
      default:
        return 'Planifié';
    }
  };

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce((acc, apt) => {
    const date = format(new Date(apt.startTime), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600 mt-1">Liste des rendez-vous à venir</p>
        </div>
        <Link to="/appointments/new" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau RDV
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'SCHEDULED', label: 'Planifiés' },
            { value: 'COMPLETED', label: 'Terminés' },
            { value: 'CANCELLED', label: 'Annulés' },
            { value: 'NO_SHOW', label: 'Absents' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-dental-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments list */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="spinner w-10 h-10" />
        </div>
      ) : Object.keys(groupedAppointments).length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun rendez-vous
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all'
              ? 'Aucun rendez-vous à venir'
              : `Aucun rendez-vous ${getStatusLabel(filter).toLowerCase()}`}
          </p>
          <Link to="/appointments/new" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Créer un rendez-vous
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAppointments)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, apts]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
                </h3>
                <div className="card divide-y divide-gray-100">
                  {apts.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50"
                    >
                      <div className="w-16 text-center">
                        <p className="text-lg font-bold text-dental-600">
                          {format(new Date(apt.startTime), 'HH:mm')}
                        </p>
                        <p className="text-xs text-gray-500">{apt.duration} min</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/patients/${apt.patientId}`}
                          className="font-medium text-gray-900 hover:text-dental-600"
                        >
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </Link>
                        <p className="text-sm text-gray-500">{apt.appointmentType}</p>
                        {apt.notes && (
                          <p className="text-sm text-gray-400 truncate">{apt.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
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
                          {getStatusIcon(apt.status)}
                          <span className="ml-1">{getStatusLabel(apt.status)}</span>
                        </span>
                      </div>

                      {apt.status === 'SCHEDULED' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateStatus(apt.id, 'COMPLETED')}
                            className="p-2 text-green-500 hover:bg-green-50 rounded-lg"
                            title="Marquer comme terminé"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(apt.id, 'NO_SHOW')}
                            className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg"
                            title="Marquer comme absent"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(apt.id, 'CANCELLED')}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

