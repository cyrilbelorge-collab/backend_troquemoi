import express from 'express';
import prisma from '../db.js';

import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/reports
router.post('/', authRequired, async (req, res) => {
  try {
    const {
      targetType,
      targetUserId,
      targetListingId,
      targetExchangeId,
      category,
      message,
    } = req.body;

    if (!targetType || !category || !message) {
      return res.status(400).json({ message: 'Champs manquants' });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.user.id,
        targetType,
        targetUserId,
        targetListingId,
        targetExchangeId,
        category,
        message,
      },
    });

    if (targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          reportCount: { increment: 1 },
        },
      });
    }

    res.status(201).json(report);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;