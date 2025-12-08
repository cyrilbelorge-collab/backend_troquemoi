import express from "express";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// Configuration Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Route pour obtenir une signature Cloudinary
router.get("/sign", async (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "troquemoi";

    // 👇 IMPORTANT : on signe TOUS les paramètres qu'on va envoyer à Cloudinary
    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.v2.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
    });
  } catch (err) {
    console.error("Erreur signature Cloudinary :", err);
    res.status(500).json({ message: "Erreur signature Cloudinary" });
  }
});

export default router;
