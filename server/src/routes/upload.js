import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

const router = express.Router();
const upload = multer(); // handle multipart/form-data

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /upload/image
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = req.file.buffer;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "damages",
        resource_type: "auto",
        transformation: [
          { quality: "auto" },
          { fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: error.message || 'Upload failed' });
        }
        if (result) {
          return res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// POST /upload/video - Upload video file (from mobile app)
router.post("/video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file uploaded'
      });
    }

    const buffer = req.file.buffer;
    const taskId = req.body.taskId || 'recording';
    const gpsData = req.body.gpsData ? JSON.parse(req.body.gpsData) : [];

    console.log('📹 Video upload request:', {
      fileName: req.file.originalname,
      fileSize: buffer.length,
      mimeType: req.file.mimetype,
      gpsPoints: gpsData.length,
      taskId
    });

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "videos/recordings",
        resource_type: "video",
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary video upload error:', error);
          return res.status(500).json({
            success: false,
            error: error.message || 'Cloudinary upload failed'
          });
        }

        if (result) {
          console.log('✅ Video uploaded successfully:', {
            url: result.secure_url,
            public_id: result.public_id,
            duration: result.duration
          });

          return res.json({
            success: true,
            data: {
              url: result.secure_url,
              public_id: result.public_id,
              duration: result.duration
            },
            url: result.secure_url, // Keep for backward compatibility
            gpsData: gpsData,
            taskId: taskId
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  } catch (error) {
    console.error('❌ Video upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

export default router;
