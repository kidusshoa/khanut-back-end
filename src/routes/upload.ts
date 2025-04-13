import express from "express";
import { upload } from "../utils/multer";

const router = express.Router();

/**
 * POST /api/upload
 * Body: FormData with key `image`
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image uploaded" });
    return res.json({ message: "Image uploaded successfully" });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    return res.status(500).json({ message: "Failed to upload image" });
  }
});

export default router;
