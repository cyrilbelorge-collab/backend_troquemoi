import express from 'express';
import { prisma } from '../db.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/ratings
router.post('/', authRequired, async (req, res) => {
  try {
    const { toUserId, exchangeId, score, comment } = req.body;
    if (!toUserId || !exchangeId || !score) {
      return res.status(400).json({ message: 'Champs manquants' });
    }

    const exchange = await prisma.exchangeOffer.findUnique({
      where: { id: exchangeId },
    });
    if (!exchange) return res.status(404).json({ message: 'Échange introuvable' });

    if (
      req.user.id !== exchange.fromUserId &&
      req.user.id !== exchange.toUserId
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const rating = await prisma.rating.create({
      data: {
        fromUserId: req.user.id,
        toUserId,
        exchangeId,
        score,
        comment: comment || '',
      },
    });

    const stats = await prisma.rating.aggregate({
      where: { toUserId },
      _avg: { score: true },
      _count: { _all: true },
    });

    await prisma.user.update({
      where: { id: toUserId },
      data: {
        rating: stats._avg.score || 0,
        ratingCount: stats._count._all,
      },
    });

    res.status(201).json(rating);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;