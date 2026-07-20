const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all appointments (with filters)
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      patientId,
      status,
      userId
    } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.createdById = userId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous' });
  }
});

// Get single appointment
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du rendez-vous' });
  }
});

// Create appointment
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      patientId,
      startTime,
      duration,
      appointmentType,
      notes,
      color
    } = req.body;

    if (!patientId || !startTime || !duration || !appointmentType) {
      return res.status(400).json({
        error: 'Patient, date/heure, durée et type de rendez-vous requis'
      });
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    // Check for overlapping appointments
    const overlapping = await prisma.appointment.findFirst({
      where: {
        status: 'SCHEDULED',
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      return res.status(409).json({
        error: 'Un rendez-vous existe déjà à cette heure'
      });
    }

    // Check for vacation
    const vacation = await prisma.vacation.findFirst({
      where: {
        startDate: { lte: start },
        endDate: { gte: start }
      }
    });

    if (vacation) {
      return res.status(409).json({
        error: 'Cette période est bloquée pour vacances/absence'
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        createdById: req.user.id,
        startTime: start,
        endTime: end,
        duration: parseInt(duration),
        appointmentType,
        notes,
        color
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du rendez-vous' });
  }
});

// Update appointment
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientId,
      startTime,
      duration,
      appointmentType,
      notes,
      status,
      color
    } = req.body;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!existingAppointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    const updateData = {};

    if (patientId) updateData.patientId = patientId;
    if (appointmentType) updateData.appointmentType = appointmentType;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (color) updateData.color = color;

    if (startTime && duration) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60000);
      updateData.startTime = start;
      updateData.endTime = end;
      updateData.duration = parseInt(duration);

      // Check for overlapping appointments (excluding current)
      const overlapping = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          status: 'SCHEDULED',
          OR: [
            {
              AND: [
                { startTime: { lte: start } },
                { endTime: { gt: start } }
              ]
            },
            {
              AND: [
                { startTime: { lt: end } },
                { endTime: { gte: end } }
              ]
            }
          ]
        }
      });

      if (overlapping) {
        return res.status(409).json({
          error: 'Un rendez-vous existe déjà à cette heure'
        });
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du rendez-vous' });
  }
});

// Delete appointment
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    await prisma.appointment.delete({
      where: { id }
    });

    res.json({ message: 'Rendez-vous supprimé avec succès' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du rendez-vous' });
  }
});

// Get appointment types
router.get('/types/list', authenticate, async (req, res) => {
  try {
    const types = await prisma.appointmentType.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(types);
  } catch (error) {
    console.error('Get appointment types error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des types' });
  }
});

// Add custom appointment type
router.post('/types', authenticate, async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nom du type requis' });
    }

    const type = await prisma.appointmentType.create({
      data: {
        name,
        color,
        isCustom: true
      }
    });

    res.status(201).json(type);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ce type existe déjà' });
    }
    console.error('Create appointment type error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du type' });
  }
});

// Today's appointments
router.get('/today/list', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous' });
  }
});

module.exports = router;

