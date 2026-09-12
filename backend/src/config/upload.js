const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const s3Client = require('./s3');

// Allowed MIME types — restrict what users can upload
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'video/mp4',
  'audio/mpeg',
];

// File filter — reject unsupported file types before they even hit S3
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true); // Accept
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false); // Reject
  }
};

// Configure multer to stream directly to S3 using multer-s3 storage engine.
// Files are NEVER written to disk — they stream straight from the client to S3.
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME,

    // Content-Type is set automatically from the uploaded file's mimetype
    contentType: multerS3.AUTO_CONTENT_TYPE,

    // Build the S3 object key: uploads/<userId>/<timestamp>-<originalFilename>
    // This namespaces files by user and prevents collisions.
    key: (req, file, cb) => {
      const userId = req.user.id;
      const timestamp = Date.now();
      const sanitizedName = path.basename(file.originalname).replace(/\s+/g, '_');
      const s3Key = `uploads/${userId}/${timestamp}-${sanitizedName}`;
      cb(null, s3Key);
    },
  }),
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max file size
  },
});

module.exports = upload;
