// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

const companyRoutes = require('./routes/companies');
const reviewRoutes = require('./routes/reviews');
const authRoutes = require('./routes/auth');
const secureRoutes = require('./routes/secure');
const requestRoutes = require('./routes/requests');
const emailRoutes = require('./routes/email'); // ✅ nieuw

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Poort
const PORT = process.env.PORT || 10000;

// Mongo URI
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ Missing MONGO_URI environment variable — set it in Render → Settings → Environment Variables');
  process.exit(1);
}

// DB connect
connectDB(mongoUri);

// Statische bestanden
app.use(express.static(path.join(__dirname, 'public')));

// Health
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    hasMongoUri: Boolean(mongoUri)
  });
});

// Auth & beveiligd
app.use('/api/auth', authRoutes);
app.use('/api', secureRoutes);

// API
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/email', emailRoutes); // ✅ nieuw

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
