const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<db_password>')) {
    console.warn('[DB] MONGODB_URI not set or contains placeholder password. Running in offline/fallback mode.');
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('[DB] Connected to MongoDB Atlas successfully.');
    return true;
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    return false;
  }
}

module.exports = { connectDB };

