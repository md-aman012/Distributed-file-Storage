const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ─────────────────────────────────────────────────────
// In production, only allow requests from the deployed Vercel
// frontend. CORS_ORIGIN is set in Render's environment variables.
// Locally, the variable is empty so we fall back to the Vite
// dev-server origin.
const allowedOrigins = [
  process.env.CORS_ORIGIN,          // production Vercel URL (set in Render)
  'http://localhost:5173',           // Vite dev-server default
  'http://localhost:4173',           // Vite preview default
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────
const authRoutes = require('./src/routes/authRoutes');
const fileRoutes = require('./src/routes/fileRoutes');

// Health check — useful for Render's health probe
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// ── Global error handling ─────────────────────────────────────
// Must be registered AFTER all routes.
const { notFound, errorHandler } = require('./src/middlewares/errorMiddleware');
app.use(notFound);     // 404 for unknown routes
app.use(errorHandler); // formats every error as JSON

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});
