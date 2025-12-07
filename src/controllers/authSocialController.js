import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

import prisma from '../db.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

/**
 * POST /api/auth/google
 * body: { idToken: string }
 */
export async function googleLogin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken manquant' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ message: 'Token Google invalide' });
    }

    const email = payload.email;
    if (!email) {
      return res.status(400).json({ message: 'Email non fourni par Google' });
    }

    const fullName = payload.name || '';
    const pseudo = fullName.isNotEmpty
      ? fullName
      : email.split('@')[0];

    // On cherche l’utilisateur par email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Si pas trouvé → on crée un compte
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: '', // social login → pas de mot de passe local
          pseudo,
          city: '',
          emailVerified: true,
        },
      });
    }

    const token = signToken(user);
    return res.json({ token, user });
  } catch (error) {
    console.error('Erreur googleLogin:', error);
    return res.status(500).json({ message: 'Erreur serveur Google login' });
  }
}

/**
 * POST /api/auth/apple
 * body: { idToken: string }
 */
export async function appleLogin(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken manquant' });
    }

    // Vérifie le token JWT envoyé par iOS
    const applePayload = await appleSignin.verifyIdToken(idToken, {
      audience: process.env.APPLE_CLIENT_ID,
      // issuer: 'https://appleid.apple.com', // optionnel, valeur par défaut
    });

    const email = applePayload.email;
    if (!email) {
      return res.status(400).json({ message: 'Email non fourni par Apple' });
    }

    const pseudo = email.split('@')[0];

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: '',
          pseudo,
          city: '',
          emailVerified: true,
        },
      });
    }

    const token = signToken(user);
    return res.json({ token, user });
  } catch (error) {
    console.error('Erreur appleLogin:', error);
    return res.status(500).json({ message: 'Erreur serveur Apple login' });
  }
}
