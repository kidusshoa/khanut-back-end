import express from "express";
import { upload } from "../utils/multer";

const router = express.Router();

/**
 * POST /api/upload
 * Body: FormData with key `image`
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    return res.json({
      message: "Image uploaded successfully",
      file: {
        url: (req.file as any).location, // S3/B2 URL
        key: (req.file as any).key,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (err: any) {
    console.error("❌ Upload Error:", err);
    return res.status(500).json({
      message: "Failed to upload image",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

export default router;
