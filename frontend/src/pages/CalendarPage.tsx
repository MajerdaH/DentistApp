import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { appointmentService, vacationService } from '../services';
import type { Appointment, CalendarEvent, Vacation } from '../types';
import { useToast } from '../contexts/ToastContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { fr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  allDay: 'Journée',
  previous: 'Précédent',
  next: 'Suivant',
  today: "Aujourd'hui",
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun rendez-vous dans cette période',
  showMore: (total: number) => `+ ${total} de plus`,
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = subMonths(currentDate, 1).toISOString();
      const endDate = addMonths(currentDate, 2).toISOString();

      const [appointments, vacationData] = await Promise.all([
        appointmentService.getAll({ startDate, endDate }),
        vacationService.getAll({ startDate, endDate }),
      ]);

      const calendarEvents: CalendarEvent[] = appointments.map((apt) => ({
        id: apt.id,
        title: `${apt.patient?.firstName} ${apt.patient?.lastName} - ${apt.appointmentType}`,
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
        resource: apt,
        color: apt.color || getStatusColor(apt.status),
      }));

      setEvents(calendarEvents);
      setVacations(vacationData);
    } catch (error) {
      showToast('Erreur lors du chargement du calendrier', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#10B981';
      case 'CANCELLED':
        return '#EF4444';
      case 'NO_SHOW':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    navigate(`/appointments/${event.id}`);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    // Check if it's within working hours (8-18)
    const hour = start.getHours();
    if (hour < 8 || hour >= 18) {
      showToast('Hors des heures de travail (8h-18h)', 'info');
      return;
    }

    // Check if it's a weekend (Sunday)
    if (start.getDay() === 0) {
      showToast('Le cabinet est fermé le dimanche', 'info');
      return;
    }

    navigate(`/appointments/new?date=${start.toISOString()}`);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color || '#3B82F6',
        borderRadius: '6px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  const dayPropGetter = (date: Date) => {
    // Check if date is in vacation period
    const isVacation = vacations.some(
      (v) => date >= new Date(v.startDate) && date <= new Date(v.endDate)
    );

    // Sunday
    if (date.getDay() === 0) {
      return {
        style: { backgroundColor: '#f3f4f6' },
      };
    }

    if (isVacation) {
      return {
        style: { backgroundColor: '#fef3c7' },
      };
    }

    return {};
  };

  const CustomToolbar = ({ onNavigate, label }: any) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg"
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 ml-4 capitalize">
          {label}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium ${
                view === v
                  ? 'bg-dental-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate('/appointments/new')}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau RDV
        </button>
      </div>
    </div>
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
        <p className="text-gray-600 mt-1">Gérer les rendez-vous du cabinet</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Planifié</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Terminé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Annulé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-100" />
          <span>Vacances</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="card p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}
          view={view}
          onView={(v) => setView(v as any)}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          messages={messages}
          culture="fr"
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          components={{
            toolbar: CustomToolbar,
          }}
          min={new Date(2024, 0, 1, 8, 0)} // 8:00 AM
          max={new Date(2024, 0, 1, 18, 0)} // 6:00 PM
          step={15}
          timeslots={4}
        />
      </div>
    </div>
  );
}

