const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireDentist } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all treatment records for a patient (dentist only)
router.get('/patient/:patientId', authenticate, requireDentist, async (req, res) => {
  try {
    const { patientId } = req.params;

    const records = await prisma.treatmentRecord.findMany({
      where: { patientId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(records);
  } catch (error) {
    console.error('Get treatment records error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des soins' });
  }
});

// Get single treatment record (dentist only)
router.get('/:id', authenticate, requireDentist, async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.treatmentRecord.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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

    if (!record) {
      return res.status(404).json({ error: 'Soin non trouvé' });
    }

    res.json(record);
  } catch (error) {
    console.error('Get treatment record error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du soin' });
  }
});

// Create treatment record (dentist only)
router.post('/', authenticate, requireDentist, async (req, res) => {
  try {
    const {
      patientId,
      date,
      treatmentType,
      teethInvolved,
      dentalChart,
      chartType,
      notes,
      cost,
      amountPaid,
      freeText
    } = req.body;

    if (!patientId || !date || !treatmentType) {
      return res.status(400).json({
        error: 'Patient, date et type de soin requis'
      });
    }

    // Calculate remaining balance
    const costNum = parseFloat(cost) || 0;
    const paidNum = parseFloat(amountPaid) || 0;
    const remainingBalance = costNum - paidNum;

    const record = await prisma.treatmentRecord.create({
      data: {
        patientId,
        createdById: req.user.id,
        date: new Date(date),
        treatmentType,
        teethInvolved: teethInvolved ? JSON.stringify(teethInvolved) : null,
        dentalChart: dentalChart ? JSON.stringify(dentalChart) : null,
        chartType: chartType || 'ADULT',
        notes,
        cost: costNum,
        amountPaid: paidNum,
        remainingBalance,
        freeText
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Create treatment record error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du soin' });
  }
});

// Update treatment record (dentist only)
router.put('/:id', authenticate, requireDentist, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      treatmentType,
      teethInvolved,
      dentalChart,
      chartType,
      notes,
      cost,
      amountPaid,
      freeText
    } = req.body;

    const existingRecord = await prisma.treatmentRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return res.status(404).json({ error: 'Soin non trouvé' });
    }

    // Calculate remaining balance
    const costNum = parseFloat(cost) || existingRecord.cost || 0;
    const paidNum = parseFloat(amountPaid) || existingRecord.amountPaid || 0;
    const remainingBalance = costNum - paidNum;

    const record = await prisma.treatmentRecord.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        treatmentType,
        teethInvolved: teethInvolved ? JSON.stringify(teethInvolved) : undefined,
        dentalChart: dentalChart ? JSON.stringify(dentalChart) : undefined,
        chartType,
        notes,
        cost: costNum,
        amountPaid: paidNum,
        remainingBalance,
        freeText
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json(record);
  } catch (error) {
    console.error('Update treatment record error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du soin' });
  }
});

// Delete treatment record (dentist only)
router.delete('/:id', authenticate, requireDentist, async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.treatmentRecord.findUnique({
      where: { id }
    });

    if (!record) {
      return res.status(404).json({ error: 'Soin non trouvé' });
    }

    await prisma.treatmentRecord.delete({
      where: { id }
    });

    res.json({ message: 'Soin supprimé avec succès' });
  } catch (error) {
    console.error('Delete treatment record error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du soin' });
  }
});

// Get treatment types
router.get('/types/list', authenticate, async (req, res) => {
  try {
    const types = await prisma.treatmentType.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(types);
  } catch (error) {
    console.error('Get treatment types error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des types' });
  }
});

// Add custom treatment type (dentist only)
router.post('/types', authenticate, requireDentist, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nom du type requis' });
    }

    const type = await prisma.treatmentType.create({
      data: {
        name,
        isCustom: true
      }
    });

    res.status(201).json(type);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ce type existe déjà' });
    }
    console.error('Create treatment type error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du type' });
  }
});

// Get patient treatment summary (financial)
router.get('/patient/:patientId/summary', authenticate, requireDentist, async (req, res) => {
  try {
    const { patientId } = req.params;

    const records = await prisma.treatmentRecord.findMany({
      where: { patientId },
      select: {
        cost: true,
        amountPaid: true,
        remainingBalance: true
      }
    });

    const summary = records.reduce(
      (acc, record) => {
        acc.totalCost += record.cost || 0;
        acc.totalPaid += record.amountPaid || 0;
        acc.totalRemaining += record.remainingBalance || 0;
        return acc;
      },
      { totalCost: 0, totalPaid: 0, totalRemaining: 0 }
    );

    summary.recordCount = records.length;

    res.json(summary);
  } catch (error) {
    console.error('Get treatment summary error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du résumé' });
  }
});

module.exports = router;

