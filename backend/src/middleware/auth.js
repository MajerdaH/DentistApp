const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verify JWT token middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

// Check if user is dentist
const requireDentist = (req, res, next) => {
  if (req.user.role !== 'DENTIST') {
    return res.status(403).json({
      error: 'Accès refusé. Seul le dentiste peut effectuer cette action.'
    });
  }
  next();
};

// Check if user is dentist or secretary
const requireStaff = (req, res, next) => {
  if (!['DENTIST', 'SECRETARY'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Accès refusé.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireDentist,
  requireStaff
};

