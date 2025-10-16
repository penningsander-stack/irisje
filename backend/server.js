// backend/server.js
// ✅ Hoofdserver voor Irisje-backend

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// 🔧 Middleware
app.use(cors());
app.use(express.json());

// 🔗 Routes
const authRoutes = require('./routes/auth');
const secureRoutes = require('./routes/secure');
const requestRoutes = require('./routes/requests');
const companyRoutes = require('./routes/companies');
const reviewRoutes = require('./routes/reviews');
const emailRoutes = require('./routes/email');

app.use('/api/auth', authRoutes);        // ✅ juiste export (router)
app.use('/api/secure', secureRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/email', emailRoutes);

// 🌐 Root endpoint
app.get('/', (req, res) => {
  res.send('✅ Irisje backend draait correct');
});

// 🧠 Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB fout:', err));

// 🚀 Start server
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));
