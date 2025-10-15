// backend/server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config(); // handig voor lokaal; op Render negeert dit als er geen .env is

const companyRoutes = require('./routes/companies');
const reviewRoutes = require('./routes/reviews');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Port
const PORT = process.env.PORT || 10000;

// Pak de URI uit env (Render: MONGO_URI). MONGODB_URI blijft als fallback voor lokaal/oud.
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

// Duidelijke fout als de env mist
if (!mongoUri) {
  console.error('❌ Missing MONGO_URI environment variable — set it in Render → Settings → Environment Variables');
  process.exit(1);
}

// Database connect
connectDB(mongoUri);

// Health endpoint (handig voor checks)
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    hasMongoUri: Boolean(mongoUri)
  });
});

// Routes
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
