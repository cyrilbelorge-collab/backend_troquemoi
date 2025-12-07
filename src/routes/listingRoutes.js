import express from 'express';
import { prisma } from '../db.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/listings
router.get('/', async (req, res) => {
  try {
    const { q, category, city } = req.query;

    const where = {
      status: 'ACTIVE',
    };

    if (category) where.category = String(category);
    if (city) where.city = String(city);
    if (q) {
      where.OR = [
        { title: { contains: String(q), mode: 'insensitive' } },
        { description: { contains: String(q), mode: 'insensitive' } },
      ];
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        images: true,
        owner: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(
      listings.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        category: l.category,
        city: l.city,
        zipCode: l.zipCode,
        openToAnyOffer: l.openToAnyOffer,
        offersWhat: l.offersWhat,
        wantsWhat: l.wantsWhat,
        createdAt: l.createdAt,
        owner: {
          id: l.owner.id,
          pseudo: l.owner.pseudo,
          rating: l.owner.rating,
          ratingCount: l.owner.ratingCount,
        },
        images: l.images.map((img) => img.url),
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        images: true,
        owner: true,
      },
    });

    if (!listing) return res.status(404).json({ message: 'Annonce introuvable' });

    res.json({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      city: listing.city,
      zipCode: listing.zipCode,
      openToAnyOffer: listing.openToAnyOffer,
      offersWhat: listing.offersWhat,
      wantsWhat: listing.wantsWhat,
      createdAt: listing.createdAt,
      owner: {
        id: listing.owner.id,
        pseudo: listing.owner.pseudo,
        rating: listing.owner.rating,
        ratingCount: listing.owner.ratingCount,
      },
      images: listing.images.map((img) => img.url),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/listings
router.post('/', authRequired, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      city,
      zipCode,
      openToAnyOffer,
      offersWhat,
      wantsWhat,
      imageUrls,
    } = req.body;

    if (!title || !description || !category || !city || !zipCode) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    const listing = await prisma.listing.create({
      data: {
        ownerId: req.user.id,
        title,
        description,
        category,
        city,
        zipCode,
        openToAnyOffer: !!openToAnyOffer,
        offersWhat: offersWhat || [],
        wantsWhat: wantsWhat || [],
        images: {
          create: (imageUrls || []).map((url, idx) => ({
            url,
            position: idx,
          })),
        },
      },
      include: { images: true },
    });

    res.status(201).json(listing);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/listings/:id
router.put('/:id', authRequired, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });
    if (!listing) return res.status(404).json({ message: 'Annonce introuvable' });
    if (listing.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const {
      title,
      description,
      category,
      city,
      zipCode,
      openToAnyOffer,
      offersWhat,
      wantsWhat,
      imageUrls,
      status,
    } = req.body;

    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: {
        title,
        description,
        category,
        city,
        zipCode,
        openToAnyOffer,
        offersWhat,
        wantsWhat,
        status,
        images: imageUrls
          ? {
              deleteMany: {},
              create: imageUrls.map((url, idx) => ({
                url,
                position: idx,
              })),
            }
          : undefined,
      },
      include: { images: true },
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });
    if (!listing) return res.status(404).json({ message: 'Annonce introuvable' });
    if (listing.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: 'ARCHIVED' },
    });

    res.json({ message: 'Annonce archivée' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;