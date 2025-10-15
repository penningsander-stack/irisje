// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const companyRoutes = require('./routes/companies');
const reviewRoutes = require('./routes/reviews');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Port
const PORT = process.env.PORT || 10000;

// Mongo URI (Render gebruikt MONGO_URI)
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

// Check of Mongo-URI aanwezig is
if (!mongoUri) {
  console.error('❌ Missing MONGO_URI environment variable — set it in Render → Settings → Environment Variables');
  process.exit(1);
}

// Database connectie
connectDB(mongoUri);

// --- Root route (voor https://irisje-backend.onrender.com) ---
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: '🚀 irisje backend is live',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      '/health',
      '/api/companies',
      '/api/reviews',
      '/api/dev/seed (indien tijdelijk actief)'
    ]
  });
});

// --- Health route ---
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    hasMongoUri: Boolean(mongoUri)
  });
});

// --- API routes ---
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);

// --- (optioneel) statische bestanden uit /public ---
// Als je later een kleine landing wilt tonen, zet daar een index.html
app.use(express.static(path.join(__dirname, 'public')));

// --- Server start ---
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
