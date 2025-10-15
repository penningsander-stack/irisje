const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const companyRoutes = require('./routes/companies');
const reviewRoutes = require('./routes/reviews');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("❌ Missing MONGO_URI environment variable — check Render → Settings → Environment");
  process.exit(1);
}

connectDB(mongoUri);


// Routes
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
