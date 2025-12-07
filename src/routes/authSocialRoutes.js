import express from 'express';
import { googleLogin, appleLogin } from '../controllers/authSocialController.js';

const router = express.Router();

// POST /api/auth/google
router.post('/google', googleLogin);

// POST /api/auth/apple
router.post('/apple', appleLogin);

export default router;
