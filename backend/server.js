// backend/server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();
const path = require('path');

// ✅ Imports van alle routes
const companyRoutes = require('./routes/companies');
const reviewRoutes = require('./routes/reviews');
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const secureRoutes = require('./routes/secure');
const seedRoutes = require('./routes/seed'); // ✅ toegevoegd — bovenaan

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/secure', secureRoutes);
app.use('/api/seed', seedRoutes); // ✅ toegevoegd — en nu correct gedefinieerd

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));
