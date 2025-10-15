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

// Poort
const PORT = process.env.PORT || 10000;

// Mongo URI (Render gebruikt MONGO_URI)
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ Missing MONGO_URI environment variable — set it in Render → Settings → Environment Variables');
  process.exit(1);
}

// DB connect
connectDB(mongoUri);

// === Statische bestanden uit /public ===
// Zorg dat backend/public/index.html bestaat
app.use(express.static(path.join(__dirname, 'public')));

// Root expliciet naar index.html (geen wildcard gebruiken i.v.m. Express v5)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    hasMongoUri: Boolean(mongoUri)
  });
});

// API-routes
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);

// (Optionele SPA-fallback voor niet-API GET-requests ZONDER wildcard patroon)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  return next();
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
