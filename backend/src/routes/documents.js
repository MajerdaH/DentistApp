const express = require('express');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireDentist } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
const prisma = new PrismaClient();

// Get all documents for a patient
router.get('/patient/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;

    const documents = await prisma.document.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
});

// Upload document for a patient
router.post('/patient/:patientId', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { description, isLegacyScan } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Fichier requis' });
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    const document = await prisma.document.create({
      data: {
        patientId,
        fileName: req.file.originalname,
        filePath: `/uploads/${patientId}/${req.file.filename}`,
        fileType: req.file.mimetype.split('/')[1],
        description,
        isLegacyScan: isLegacyScan === 'true' || isLegacyScan === true
      }
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du document' });
  }
});

// Upload multiple documents
router.post('/patient/:patientId/multiple', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { descriptions, isLegacyScan } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Au moins un fichier requis' });
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    const descArray = descriptions ?
      (Array.isArray(descriptions) ? descriptions : [descriptions]) :
      [];

    const documents = await Promise.all(
      req.files.map((file, index) =>
        prisma.document.create({
          data: {
            patientId,
            fileName: file.originalname,
            filePath: `/uploads/${patientId}/${file.filename}`,
            fileType: file.mimetype.split('/')[1],
            description: descArray[index] || null,
            isLegacyScan: isLegacyScan === 'true' || isLegacyScan === true
          }
        })
      )
    );

    res.status(201).json(documents);
  } catch (error) {
    console.error('Upload multiple documents error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload des documents' });
  }
});

// Get single document
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du document' });
  }
});

// Update document description
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const document = await prisma.document.update({
      where: { id },
      data: { description }
    });

    res.json(document);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du document' });
  }
});

// Delete document (dentist only for medical docs)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '../../', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await prisma.document.delete({
      where: { id }
    });

    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du document' });
  }
});

// Download document
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    const filePath = path.join(__dirname, '../../', document.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé sur le serveur' });
    }

    res.download(filePath, document.fileName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement du document' });
  }
});

module.exports = router;

