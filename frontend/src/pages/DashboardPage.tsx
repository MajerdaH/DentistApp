import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services';
import type { DashboardStats } from '../types';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Plus,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await settingsService.getDashboard();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const today = new Date();
  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            {format(today, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/patients/new" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau patient
          </Link>
          <Link to="/appointments/new" className="btn btn-secondary">
            <Calendar className="w-4 h-4 mr-2" />
            Nouveau RDV
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-dental-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-dental-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">RDV aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.todayAppointments || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">RDV cette semaine</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.weekAppointments || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">À venir</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.upcomingAppointments?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Prochains rendez-vous</h2>
            <Link to="/calendar" className="text-sm text-dental-600 hover:text-dental-700">
              Voir l'agenda
            </Link>
          </div>
          <div className="card-body p-0">
            {stats?.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.upcomingAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    to={`/appointments/${apt.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-dental-50 flex flex-col items-center justify-center">
                      <span className="text-xs text-dental-600 font-medium">
                        {format(new Date(apt.startTime), 'MMM', { locale: fr })}
                      </span>
                      <span className="text-lg font-bold text-dental-700">
                        {format(new Date(apt.startTime), 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{apt.appointmentType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(apt.startTime), 'HH:mm')}
                      </p>
                      <p className="text-xs text-gray-500">{apt.duration} min</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun rendez-vous à venir</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent patients */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Patients récents</h2>
            <Link to="/patients" className="text-sm text-dental-600 hover:text-dental-700">
              Voir tous
            </Link>
          </div>
          <div className="card-body p-0">
            {stats?.recentPatients && stats.recentPatients.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-dental-100 flex items-center justify-center">
                      <span className="text-dental-700 font-medium">
                        {patient.firstName[0]}{patient.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Ajouté {format(new Date(patient.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun patient enregistré</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

