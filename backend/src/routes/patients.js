const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireDentist } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all patients
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } }
          ]
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { lastName: 'asc' },
        include: {
          _count: {
            select: {
              appointments: true,
              treatmentRecords: true,
              documents: true
            }
          }
        }
      }),
      prisma.patient.count({ where })
    ]);

    // If user is secretary, hide sensitive medical info
    const sanitizedPatients = patients.map(patient => {
      if (req.user.role === 'SECRETARY') {
        return {
          ...patient,
          allergies: undefined,
          notes: undefined
        };
      }
      return patient;
    });

    res.json({
      patients: sanitizedPatients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des patients' });
  }
});

// Get single patient
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
          include: {
            createdBy: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        treatmentRecords: req.user.role === 'DENTIST' ? {
          orderBy: { date: 'desc' },
          include: {
            createdBy: {
              select: { firstName: true, lastName: true }
            }
          }
        } : false,
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            appointments: true,
            treatmentRecords: true,
            documents: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // If user is secretary, hide sensitive medical info
    if (req.user.role === 'SECRETARY') {
      patient.allergies = undefined;
      patient.notes = undefined;
      patient.treatmentRecords = undefined;
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du patient' });
  }
});

// Create patient
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      phone,
      email,
      address,
      cnam,
      treatingDoctor,
      emergencyContact,
      allergies,
      notes
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Prénom et nom requis' });
    }

    // Secretary cannot add medical info
    const patientData = {
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      phone,
      email,
      address,
      cnam: cnam || false,
      treatingDoctor,
      emergencyContact
    };

    // Only dentist can add medical info
    if (req.user.role === 'DENTIST') {
      patientData.allergies = allergies;
      patientData.notes = notes;
    }

    const patient = await prisma.patient.create({
      data: patientData
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du patient' });
  }
});

// Update patient
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      phone,
      email,
      address,
      cnam,
      treatingDoctor,
      emergencyContact,
      allergies,
      notes
    } = req.body;

    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!existingPatient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Build update data based on role
    const updateData = {
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      phone,
      email,
      address,
      cnam,
      treatingDoctor,
      emergencyContact
    };

    // Only dentist can update medical info
    if (req.user.role === 'DENTIST') {
      updateData.allergies = allergies;
      updateData.notes = notes;
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData
    });

    res.json(patient);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du patient' });
  }
});

// Delete patient (only dentist)
router.delete('/:id', authenticate, requireDentist, async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    await prisma.patient.delete({
      where: { id }
    });

    res.json({ message: 'Patient supprimé avec succès' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du patient' });
  }
});

// Quick create patient for migration (name + scan only)
router.post('/quick', authenticate, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Prénom et nom requis' });
    }

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName
      }
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error('Quick create patient error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du patient' });
  }
});

module.exports = router;

