import express from 'express';
import prisma from '../db.js';

import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/exchanges
router.post('/', authRequired, async (req, res) => {
  try {
    const { listingId, proposedListingIds, message } = req.body;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) return res.status(404).json({ message: 'Annonce introuvable' });
    if (listing.ownerId === req.user.id) {
      return res.status(400).json({ message: 'Impossible de proposer un échange sur sa propre annonce' });
    }

    const offer = await prisma.exchangeOffer.create({
      data: {
        listingId,
        fromUserId: req.user.id,
        toUserId: listing.ownerId,
        proposedListingIds: proposedListingIds || [],
        message,
      },
    });

    res.status(201).json(offer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/exchanges/mine
router.get('/mine', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const offers = await prisma.exchangeOffer.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        listing: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(offers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/exchanges/:id/status
router.post('/:id/status', authRequired, async (req, res) => {
  try {
    const { status } = req.body;
    const offer = await prisma.exchangeOffer.findUnique({
      where: { id: req.params.id },
    });
    if (!offer) return res.status(404).json({ message: 'Offre introuvable' });

    if (offer.toUserId !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const allowed = [
      'ACCEPTED',
      'REFUSED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const updated = await prisma.exchangeOffer.update({
      where: { id: offer.id },
      data: { status },
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;