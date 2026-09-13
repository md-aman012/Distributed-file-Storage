const express = require('express');
const router = express.Router();

const { uploadFile, getMyFiles, getFileById, getDownloadUrl, deleteFile, toggleShare, getSharedFile } = require('../controllers/fileController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../config/upload');

// All file routes are private — every request must carry a valid JWT

// POST /api/files/upload
// upload.single('file') is multer middleware — it parses the multipart form-data,
// streams the file to S3, and attaches result to req.file before calling uploadFile
router.post('/upload', protect, upload.single('file'), uploadFile);

// GET /api/files
// Returns all files belonging to the authenticated user
router.get('/', protect, getMyFiles);

// GET /api/files/shared/:id
// Public route for shared files (no 'protect' middleware)
router.get('/shared/:id', getSharedFile);

// GET /api/files/:id
// Returns metadata for a single file (only if owned by the requesting user)
router.get('/:id', protect, getFileById);

router.get('/:id', protect, getFileById);

// GET /api/files/:id/download
router.get('/:id/download', protect, getDownloadUrl);

// DELETE /api/files/:id
router.delete('/:id', protect, deleteFile);

// PATCH /api/files/:id/share
router.patch('/:id/share', protect, toggleShare);

module.exports = router;
