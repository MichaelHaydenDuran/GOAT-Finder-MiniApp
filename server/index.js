// server/index.js
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  // removed arg (process.env.MONGODB_URI)
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
})();
