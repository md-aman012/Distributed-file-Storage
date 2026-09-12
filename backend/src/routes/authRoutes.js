const express = require('express');
const router = express.Router();
const { signup, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Private route (protected by middleware)
router.get('/profile', protect, getProfile);

module.exports = router;
