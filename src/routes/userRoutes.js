import express from 'express';
import prisma from '../db.js';

import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/me
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    res.json({
      id: user.id,
      email: user.email,
      pseudo: user.pseudo,
      city: user.city,
      zipCode: user.zipCode,
      rating: user.rating,
      ratingCount: user.ratingCount,
      trustScore: user.trustScore,
      reportCount: user.reportCount,
      warningCount: user.warningCount,
      createdAt: user.createdAt,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/users/:id/public
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        listings: true,
      },
    });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const ratings = await prisma.rating.findMany({
      where: { toUserId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      id: user.id,
      pseudo: user.pseudo,
      city: user.city,
      rating: user.rating,
      ratingCount: user.ratingCount,
      createdAt: user.createdAt,
      listingsCount: user.listings.length,
      trustScore: user.trustScore,
      badges: {
        verified: user.emailVerified,
        veryWellRated: user.rating >= 4.5 && user.ratingCount >= 5,
        exchanges10Plus: user.ratingCount >= 10,
      },
      lastRatings: ratings,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;