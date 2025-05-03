require('dotenv').config();
const isTestEnv = process.env.NODE_ENV === 'test';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5000;

// Import modular files
const routes = require('./routes');
const { migrateChallenges } = require('./models');
const { limiter } = require('./middleware');

// Enhanced CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
// In your backend routes
app.get('/api/data', (req, res) => {
  res.json({ message: "Connected successfully!" });
});
// MongoDB connection with authentication
if (!isTestEnv) {
<<<<<<< HEAD
  mongoose.connect(process.env.DB_CONNECTION_STRING || "mongodb://localhost:27017/ctf-platform", {
=======
  mongoose.connect(process.env.MONGODB_URI, {
>>>>>>> e240943358f788ab9a0730efc539051e5e1bc646
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to MongoDB");
    return migrateChallenges();
  })
  .catch(err => console.error("MongoDB connection error:", err));
}

// Serve static files
app.use('/avatars', express.static('uploads/avatars'));

// Use routes
app.use('/', routes);
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    dbStatus: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date()
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

if (process.env.NODE_ENV === 'test') {
  module.exports = app;
} else {
  module.exports = { app };
<<<<<<< HEAD
}
=======
}
>>>>>>> e240943358f788ab9a0730efc539051e5e1bc646
