// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async (uri = process.env.MONGODB_URI || process.env.MONGO_URI) => {
  try {
    if (!uri) throw new Error('Missing MongoDB URI (set MONGODB_URI or MONGO_URI)');

    await mongoose.connect(uri, {
      // these options are safe across most Mongoose versions
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
