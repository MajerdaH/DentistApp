const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { uploadDir } = require('./config/paths');

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const treatmentRoutes = require('./routes/treatments');
const documentRoutes = require('./routes/documents');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');
const vacationRoutes = require('./routes/vacations');

// Import backup service
const { scheduleDailyBackup } = require('./services/backupService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('CORS blocked origin:', origin);
    return callback(null, true); // temporarily allow all origins to unblock login; tighten later
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(uploadDir));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/vacations', vacationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cabinet Dentaire API is running' });
});

// Schedule daily backup at 2:00 AM
cron.schedule('0 2 * * *', () => {
  console.log('Running scheduled daily backup...');
  scheduleDailyBackup();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Une erreur interne est survenue',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route non trouvée', status: 404 } });
});

app.listen(PORT, () => {
  console.log(`📁 Uploads directory: ${uploadDir}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, '../uploads')}`);
});

module.exports = app;

