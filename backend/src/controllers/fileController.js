const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');
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

// @desc    Get an S3 presigned URL for downloading a file
// @route   GET /api/files/:id/download
// @access  Private
const getDownloadUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    // Verify ownership and get s3_key
    const result = await db.query(
      `SELECT s3_key, original_name, mime_type FROM files WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'File not found' });
    const file = result.rows[0];

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: file.s3_key,
      ResponseContentDisposition: `attachment; filename="${file.original_name}"`,
      ResponseContentType: file.mime_type
    });

    // URL expires in 1 hour
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ url });
  } catch (error) {
    console.error('Error in getDownloadUrl:', error);
    res.status(500).json({ message: 'Server error generating download link' });
  }
};

// @desc    Delete a file (DB + S3)
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const result = await db.query(
      `SELECT s3_key FROM files WHERE id = $1 AND user_id = $2`,
      [fileId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'File not found' });
    const file = result.rows[0];

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: file.s3_key,
    });
    await s3Client.send(command);

    // Delete from DB
    await db.query(`DELETE FROM files WHERE id = $1 AND user_id = $2`, [fileId, userId]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error in deleteFile:', error);
    res.status(500).json({ message: 'Server error deleting file' });
  }
};

// @desc    Toggle file sharing
// @route   PATCH /api/files/:id/share
// @access  Private
const toggleShare = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const result = await db.query(
      `UPDATE files SET is_shared = NOT is_shared WHERE id = $1 AND user_id = $2 RETURNING is_shared`,
      [fileId, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'File not found' });

    res.json({ is_shared: result.rows[0].is_shared });
  } catch (error) {
    console.error('Error in toggleShare:', error);
    res.status(500).json({ message: 'Server error toggling share status' });
  }
};

// @desc    Get public shared file metadata and download link
// @route   GET /api/files/shared/:id
// @access  Public
const getSharedFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    const result = await db.query(
      `SELECT original_name, file_size, mime_type, s3_key, is_shared FROM files WHERE id = $1`,
      [fileId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_shared) {
      return res.status(404).json({ message: 'File not found or not shared' });
    }

    const file = result.rows[0];

    // Generate presigned URL for public download
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: file.s3_key,
      ResponseContentDisposition: `attachment; filename="${file.original_name}"`,
      ResponseContentType: file.mime_type
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      file: {
        original_name: file.original_name,
        file_size: file.file_size,
        mime_type: file.mime_type
      },
      downloadUrl: url
    });
  } catch (error) {
    console.error('Error in getSharedFile:', error);
    res.status(500).json({ message: 'Server error fetching shared file' });
  }
};

module.exports = {
  uploadFile,
  getMyFiles,
  getFileById,
  getDownloadUrl,
  deleteFile,
  toggleShare,
  getSharedFile,
};
