// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DENTIST' | 'SECRETARY';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Patient types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  cnam: boolean;
  treatingDoctor?: string;
  emergencyContact?: string;
  allergies?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments: number;
    treatmentRecords: number;
    documents: number;
  };
  appointments?: Appointment[];
  treatmentRecords?: TreatmentRecord[];
  documents?: Document[];
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  cnam?: boolean;
  treatingDoctor?: string;
  emergencyContact?: string;
  allergies?: string;
  notes?: string;
}

// Document types
export interface Document {
  id: string;
  patientId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  description?: string;
  isLegacyScan: boolean;
  createdAt: string;
}

// Treatment types
export interface TreatmentRecord {
  id: string;
  patientId: string;
  createdById: string;
  date: string;
  treatmentType: string;
  teethInvolved?: string;
  dentalChart?: string;
  chartType: 'ADULT' | 'CHILD';
  notes?: string;
  cost?: number;
  amountPaid?: number;
  remainingBalance?: number;
  freeText?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TreatmentFormData {
  patientId: string;
  date: string;
  treatmentType: string;
  teethInvolved?: number[];
  dentalChart?: DentalChartState;
  chartType?: 'ADULT' | 'CHILD';
  notes?: string;
  cost?: number;
  amountPaid?: number;
  freeText?: string;
}

export interface TreatmentType {
  id: string;
  name: string;
  isCustom: boolean;
}

// Dental chart types
export interface ToothState {
  number: number;
  status: 'healthy' | 'treated' | 'problem' | 'missing' | 'selected';
  notes?: string;
}

export interface DentalChartState {
  chartType: 'ADULT' | 'CHILD';
  teeth: ToothState[];
}

// Appointment types
export interface Appointment {
  id: string;
  patientId: string;
  createdById: string;
  startTime: string;
  endTime: string;
  duration: number;
  appointmentType: string;
  notes?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  color?: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface AppointmentFormData {
  patientId: string;
  startTime: string;
  duration: number;
  appointmentType: string;
  notes?: string;
  color?: string;
}

export interface AppointmentType {
  id: string;
  name: string;
  color?: string;
  isCustom: boolean;
}

// Vacation types
export interface Vacation {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// Settings types
export interface CabinetSettings {
  id: string;
  cabinetName?: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: {
    start: string;
    end: string;
  };
  workingDays?: number[];
  logoPath?: string;
}

// Dashboard types
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  weekAppointments: number;
  upcomingAppointments: Appointment[];
  recentPatients: Patient[];
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  status?: number;
}

// Calendar event type
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: Appointment;
  color?: string;
}

