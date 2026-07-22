const express = require('express');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireDentist } = require('../middleware/auth');
const { sendBackupEmail } = require('../services/emailService');
const { uploadDir, dbPath } = require('../config/paths');

const router = express.Router();
const prisma = new PrismaClient();

// Manual backup download
router.get('/download', authenticate, requireDentist, async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `cabinet-dentaire-backup-${timestamp}.zip`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Create ZIP archive
    const output = fs.createWriteStream(backupFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      // Log backup
      await prisma.backupLog.create({
        data: {
          fileName: backupFileName,
          filePath: backupFilePath,
          size: archive.pointer()
        }
      });

      // Send file
      res.download(backupFilePath, backupFileName, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Optionally delete after download
        // fs.unlinkSync(backupFilePath);
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    const dbFilePath = dbPath;
    if (fs.existsSync(dbFilePath)) {
      archive.file(dbFilePath, { name: 'database.db' });
    }

    const uploadsPath = uploadDir;
    if (fs.existsSync(uploadsPath)) {
      archive.directory(uploadsPath, 'uploads');
    }

    // Export data as JSON for portability
    const [patients, appointments, treatments, documents, users, settings] = await Promise.all([
      prisma.patient.findMany(),
      prisma.appointment.findMany(),
      prisma.treatmentRecord.findMany(),
      prisma.document.findMany(),
      prisma.user.findMany({ select: { id: true, email: true, firstName: true, lastName: true, role: true } }),
      prisma.cabinetSettings.findFirst()
    ]);

    const jsonData = {
      exportDate: new Date().toISOString(),
      patients,
      appointments,
      treatments,
      documents,
      users,
      settings
    };

    archive.append(JSON.stringify(jsonData, null, 2), { name: 'data-export.json' });

    archive.finalize();
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la sauvegarde' });
  }
});

// Get backup history
router.get('/history', authenticate, requireDentist, async (req, res) => {
  try {
    const backups = await prisma.backupLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json(backups);
  } catch (error) {
    console.error('Get backup history error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// Trigger email backup manually
router.post('/email', authenticate, requireDentist, async (req, res) => {
  try {
    const result = await sendBackupEmail();

    if (result.success) {
      res.json({ message: 'Sauvegarde envoyée par email avec succès' });
    } else {
      res.status(500).json({ error: result.error || 'Erreur lors de l\'envoi' });
    }
  } catch (error) {
    console.error('Email backup error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la sauvegarde par email' });
  }
});

module.exports = router;

