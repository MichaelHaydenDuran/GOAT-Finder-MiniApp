// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('❌ Missing MONGO_URI in .env');

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};

module.exports = connectDB;
