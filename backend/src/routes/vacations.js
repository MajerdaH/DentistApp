const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireDentist } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all vacations
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: { gte: new Date(startDate), lte: new Date(endDate) }
        },
        {
          endDate: { gte: new Date(startDate), lte: new Date(endDate) }
        }
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    const vacations = await prisma.vacation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    res.json(vacations);
  } catch (error) {
    console.error('Get vacations error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des vacances' });
  }
});

// Create vacation (dentist only)
router.post('/', authenticate, requireDentist, async (req, res) => {
  try {
    const { userId, startDate, endDate, reason } = req.body;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Utilisateur, date de début et date de fin requis'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        error: 'La date de début doit être avant la date de fin'
      });
    }

    // Check for overlapping vacations
    const overlapping = await prisma.vacation.findFirst({
      where: {
        userId,
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      return res.status(409).json({
        error: 'Une période de vacances existe déjà pour ces dates'
      });
    }

    const vacation = await prisma.vacation.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        reason
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(vacation);
  } catch (error) {
    console.error('Create vacation error:', error);
    res.status(500).json({ error: 'Erreur lors de la création des vacances' });
  }
});

// Update vacation (dentist only)
router.put('/:id', authenticate, requireDentist, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;

    const existingVacation = await prisma.vacation.findUnique({
      where: { id }
    });

    if (!existingVacation) {
      return res.status(404).json({ error: 'Vacances non trouvées' });
    }

    const vacation = await prisma.vacation.update({
      where: { id },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        reason
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    res.json(vacation);
  } catch (error) {
    console.error('Update vacation error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour des vacances' });
  }
});

// Delete vacation (dentist only)
router.delete('/:id', authenticate, requireDentist, async (req, res) => {
  try {
    const { id } = req.params;

    const vacation = await prisma.vacation.findUnique({
      where: { id }
    });

    if (!vacation) {
      return res.status(404).json({ error: 'Vacances non trouvées' });
    }

    await prisma.vacation.delete({
      where: { id }
    });

    res.json({ message: 'Vacances supprimées avec succès' });
  } catch (error) {
    console.error('Delete vacation error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression des vacances' });
  }
});

module.exports = router;

