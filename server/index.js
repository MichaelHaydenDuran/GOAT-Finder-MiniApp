// server/index.js
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Optional: verify the connection is healthy
    const state = mongoose.connection.readyState;
    if (state === 1) {
      console.log('✅ MongoDB connected successfully');
    } else {
      console.warn('⚠️  MongoDB connection state:', state);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Gracefully shutting down...');
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
})();
