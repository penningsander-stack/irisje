// backend/config/db.js
const mongoose = require('mongoose');

/**
 * Connect to MongoDB with a provided connection string.
 * Usage: connectDB(process.env.MONGO_URI)
 */
const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
