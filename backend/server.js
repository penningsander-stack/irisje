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

// Poort instellen
const PORT = process.env.PORT || 10000;

// Mongo URI ophalen (Render gebruikt MONGO_URI)
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

// Check of Mongo-URI aanwezig is
if (!mongoUri) {
  console.error('❌ Missing MONGO_URI environment variable — set it in Render → Settings → Environment Variables');
  process.exit(1);
}

// Verbinden met MongoDB
connectDB(mongoUri);

// === Routes ===

// 1️⃣ Statische bestanden (zoals index.html in /public)
app.use(express.static(path.join(__dirname, 'public')));

// 2️⃣ Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    hasMongoUri: Boolean(mongoUri)
  });
});

// 3️⃣ API-routes
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);

// 4️⃣ Fallback naar index.html voor root (alle andere GET requests tonen /public/index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5️⃣ Server starten
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
