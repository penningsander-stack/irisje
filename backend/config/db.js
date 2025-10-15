// backend/config/db.js
const mongoose = require('mongoose');

/**
 * Verbindt met MongoDB via de opgegeven URI.
 * Wordt aangeroepen vanuit server.js met connectDB(process.env.MONGO_URI)
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
