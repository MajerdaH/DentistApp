import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Components
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientFormPage from './pages/PatientFormPage';
import PatientDetailPage from './pages/PatientDetailPage';
import QuickMigrationPage from './pages/QuickMigrationPage';
import CalendarPage from './pages/CalendarPage';
import AppointmentFormPage from './pages/AppointmentFormPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Dentist only route wrapper
function DentistRoute({ children }: { children: React.ReactNode }) {
  const { isDentist, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    );
  }

  if (!isDentist) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Patients */}
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/new" element={<PatientFormPage />} />
        <Route path="patients/quick" element={<QuickMigrationPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="patients/:id/edit" element={<PatientFormPage />} />

        {/* Calendar & Appointments */}
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="appointments/new" element={<AppointmentFormPage />} />
        <Route path="appointments/:id" element={<AppointmentFormPage />} />

        {/* Settings - Dentist only */}
        <Route
          path="settings"
          element={
            <DentistRoute>
              <SettingsPage />
            </DentistRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

