const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireDentist } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get cabinet settings
router.get('/', authenticate, async (req, res) => {
  try {
    let settings = await prisma.cabinetSettings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await prisma.cabinetSettings.create({
        data: {
          workingHours: JSON.stringify({
            start: '08:00',
            end: '18:00'
          }),
          workingDays: JSON.stringify([1, 2, 3, 4, 5, 6]) // Mon-Sat
        }
      });
    }

    // Parse JSON fields
    if (settings.workingHours) {
      settings.workingHours = JSON.parse(settings.workingHours);
    }
    if (settings.workingDays) {
      settings.workingDays = JSON.parse(settings.workingDays);
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des paramètres' });
  }
});

// Update cabinet settings (dentist only)
router.put('/', authenticate, requireDentist, async (req, res) => {
  try {
    const {
      cabinetName,
      address,
      phone,
      email,
      workingHours,
      workingDays
    } = req.body;

    let settings = await prisma.cabinetSettings.findFirst();

    const updateData = {
      cabinetName,
      address,
      phone,
      email,
      workingHours: workingHours ? JSON.stringify(workingHours) : undefined,
      workingDays: workingDays ? JSON.stringify(workingDays) : undefined
    };

    if (settings) {
      settings = await prisma.cabinetSettings.update({
        where: { id: settings.id },
        data: updateData
      });
    } else {
      settings = await prisma.cabinetSettings.create({
        data: updateData
      });
    }

    // Parse JSON fields for response
    if (settings.workingHours) {
      settings.workingHours = JSON.parse(settings.workingHours);
    }
    if (settings.workingDays) {
      settings.workingDays = JSON.parse(settings.workingDays);
    }

    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

// Get dashboard stats
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const [
      totalPatients,
      todayAppointments,
      weekAppointments,
      upcomingAppointments,
      recentPatients
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({
        where: {
          startTime: { gte: today, lt: tomorrow }
        }
      }),
      prisma.appointment.count({
        where: {
          startTime: { gte: startOfWeek, lte: endOfWeek }
        }
      }),
      prisma.appointment.findMany({
        where: {
          startTime: { gte: new Date() },
          status: 'SCHEDULED'
        },
        take: 5,
        orderBy: { startTime: 'asc' },
        include: {
          patient: {
            select: { firstName: true, lastName: true }
          }
        }
      }),
      prisma.patient.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      totalPatients,
      todayAppointments,
      weekAppointments,
      upcomingAppointments,
      recentPatients
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;

