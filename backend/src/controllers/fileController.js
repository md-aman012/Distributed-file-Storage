const db = require('../config/db');

// @desc    Upload a file to S3 and save its metadata to the database
// @route   POST /api/files/upload
// @access  Private (JWT required)
const uploadFile = async (req, res) => {
  try {
    // multer-s3 has already streamed the file to S3 at this point.
    // It attaches the uploaded file's info to req.file.
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please include a file in the request.' });
    }

    const userId = req.user.id;

    // Extract metadata from the multer-s3 result
    const originalName = req.file.originalname;
    const s3Key = req.file.key;           // The S3 object key (e.g., "uploads/<userId>/<timestamp>-<name>")
    const fileSize = req.file.size;       // Size in bytes
    const mimeType = req.file.mimetype;

    // Save file metadata to the PostgreSQL `files` table
    const result = await db.query(
      `INSERT INTO files (user_id, original_name, s3_key, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, original_name, s3_key, file_size, mime_type, uploaded_at`,
      [userId, originalName, s3Key, fileSize, mimeType]
    );

    const savedFile = result.rows[0];

    res.status(201).json({
      message: 'File uploaded successfully',
      file: savedFile,
    });
  } catch (error) {
    console.error('Error in uploadFile:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
};

// @desc    Get all files belonging to the authenticated user
// @route   GET /api/files
// @access  Private (JWT required)
const getMyFiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, original_name, s3_key, file_size, mime_type, uploaded_at
       FROM files
       WHERE user_id = $1
       ORDER BY uploaded_at DESC`,
      [userId]
    );

    res.json({
      count: result.rows.length,
      files: result.rows,
    });
  } catch (error) {
    console.error('Error in getMyFiles:', error);
    res.status(500).json({ message: 'Server error fetching files' });
  }
};

// @desc    Get a single file's metadata by its ID (only if it belongs to the user)
// @route   GET /api/files/:id
// @access  Private (JWT required)
const getFileById = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const result = await db.query(
      `SELECT id, original_name, s3_key, file_size, mime_type, uploaded_at
       FROM files
       WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    );

    if (result.rows.length === 0) {
      // Return 404 for both "not found" and "belongs to another user"
      // — never reveal that a file exists but belongs to someone else
      return res.status(404).json({ message: 'File not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error in getFileById:', error);
    res.status(500).json({ message: 'Server error fetching file' });
  }
};

module.exports = {
  uploadFile,
  getMyFiles,
  getFileById,
};
