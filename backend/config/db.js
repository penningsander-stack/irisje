// backend/config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // ✅ Render gebruikt MONGO_URI; lokale tests gebruiken MONGODB_URI
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('❌ Geen MongoDB URI gevonden in environment variabelen');
    }

    // 🔧 Verbind zonder verouderde opties
    await mongoose.connect(uri);

    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
