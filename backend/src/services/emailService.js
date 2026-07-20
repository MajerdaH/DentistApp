const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create email transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send backup email
const sendBackupEmail = async () => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.log('Email not configured, skipping backup email');
      return { success: false, error: 'Email non configuré' };
    }

    const backupEmail = process.env.BACKUP_EMAIL;
    if (!backupEmail) {
      return { success: false, error: 'Email de destination non configuré' };
    }

    // Create backup
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `cabinet-dentaire-backup-${timestamp}.zip`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Create ZIP
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backupFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      // Add database
      const dbPath = path.join(__dirname, '../../prisma/dev.db');
      if (fs.existsSync(dbPath)) {
        archive.file(dbPath, { name: 'database.db' });
      }

      // Add uploads
      const uploadsPath = path.join(__dirname, '../../uploads');
      if (fs.existsSync(uploadsPath)) {
        archive.directory(uploadsPath, 'uploads');
      }

      archive.finalize();
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'cabinet@dentiste.com',
      to: backupEmail,
      subject: `Sauvegarde Cabinet Dentaire - ${new Date().toLocaleDateString('fr-FR')}`,
      html: `
        <h2>Sauvegarde automatique</h2>
        <p>Veuillez trouver ci-joint la sauvegarde quotidienne de votre cabinet dentaire.</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        <p>Cette sauvegarde contient:</p>
        <ul>
          <li>Base de données complète</li>
          <li>Tous les documents patients</li>
        </ul>
        <p><em>Ceci est un email automatique, merci de ne pas répondre.</em></p>
      `,
      attachments: [
        {
          filename: backupFileName,
          path: backupFilePath
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    // Log backup
    await prisma.backupLog.create({
      data: {
        fileName: backupFileName,
        filePath: backupFilePath,
        size: fs.statSync(backupFilePath).size
      }
    });

    console.log('Backup email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Send backup email error:', error);
    return { success: false, error: error.message };
  }
};

// Send appointment reminder
const sendAppointmentReminder = async (appointment, patient) => {
  try {
    const transporter = createTransporter();

    if (!transporter || !patient.email) {
      return { success: false, error: 'Email non configuré ou patient sans email' };
    }

    const appointmentDate = new Date(appointment.startTime);
    const formattedDate = appointmentDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = appointmentDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const settings = await prisma.cabinetSettings.findFirst();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'cabinet@dentiste.com',
      to: patient.email,
      subject: `Rappel de rendez-vous - ${formattedDate}`,
      html: `
        <h2>Rappel de rendez-vous</h2>
        <p>Bonjour ${patient.firstName} ${patient.lastName},</p>
        <p>Nous vous rappelons votre rendez-vous chez le dentiste:</p>
        <ul>
          <li><strong>Date:</strong> ${formattedDate}</li>
          <li><strong>Heure:</strong> ${formattedTime}</li>
          <li><strong>Type:</strong> ${appointment.appointmentType}</li>
        </ul>
        ${settings?.cabinetName ? `<p><strong>Cabinet:</strong> ${settings.cabinetName}</p>` : ''}
        ${settings?.address ? `<p><strong>Adresse:</strong> ${settings.address}</p>` : ''}
        ${settings?.phone ? `<p><strong>Téléphone:</strong> ${settings.phone}</p>` : ''}
        <p>En cas d'empêchement, merci de nous prévenir au plus tôt.</p>
        <p>Cordialement,<br>Votre cabinet dentaire</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Send reminder error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBackupEmail,
  sendAppointmentReminder,
  createTransporter
};

