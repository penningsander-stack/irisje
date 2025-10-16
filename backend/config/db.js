// backend/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // ✅ werkt met beide variabelen (Render gebruikt MONGO_URI)
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
      throw new Error('❌ Geen MongoDB URI gevonden in environment variabelen');
    }

    await mongoose.connect(uri, {
      autoIndex: true
    });

    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
