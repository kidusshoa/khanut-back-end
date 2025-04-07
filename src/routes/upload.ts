import express from "express";
import { upload } from "../middleware/upload";
import { uploadToB2 } from "../utils/backblaze";

const router = express.Router();

/**
 * POST /api/upload
 * Body: FormData with key `image`
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image uploaded" });

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;

    const fileName = `uploads/${Date.now()}-${originalName}`;

    const fileUrl = await uploadToB2(fileBuffer, fileName, mimeType);

    return res.status(201).json({ url: fileUrl });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    return res.status(500).json({ message: "Failed to upload image" });
  }
});

export default router;
