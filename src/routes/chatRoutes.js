import express from 'express';
import prisma from '../db.js';

import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/chat/:exchangeId
router.get('/:exchangeId', authRequired, async (req, res) => {
  try {
    const { exchangeId } = req.params;

    const exchange = await prisma.exchangeOffer.findUnique({
      where: { id: exchangeId },
    });
    if (!exchange) return res.status(404).json({ message: 'Échange introuvable' });

    if (
      exchange.fromUserId !== req.user.id &&
      exchange.toUserId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { exchangeId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/chat/:exchangeId
router.post('/:exchangeId', authRequired, async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ message: 'Message vide' });

    const exchange = await prisma.exchangeOffer.findUnique({
      where: { id: exchangeId },
    });
    if (!exchange) return res.status(404).json({ message: 'Échange introuvable' });

    if (
      exchange.fromUserId !== req.user.id &&
      exchange.toUserId !== req.user.id
    ) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const msg = await prisma.chatMessage.create({
      data: {
        exchangeId,
        senderId: req.user.id,
        text,
      },
    });

    res.status(201).json(msg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;