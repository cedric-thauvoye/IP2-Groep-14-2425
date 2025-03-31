const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Verify required env variables are set
const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please set these variables in your .env file or environment.');

  // Set default JWT_SECRET for development (not recommended for production)
  if (missingEnvVars.includes('JWT_SECRET') && process.env.NODE_ENV !== 'production') {
    console.warn('Setting a default JWT_SECRET for development. DO NOT use in production!');
    process.env.JWT_SECRET = 'default-development-secret-do-not-use-in-production';
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Create a database connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection without auto-executing schema
const testDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database!');
    connection.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    console.error('Please ensure the database is created and credentials are correct.');
    console.error('Manual schema setup is required - run the schema.sql file in your MySQL client.');
    return false;
  }
};

// Import route modules
const authRoutes = require('./routes/auth')(pool, jwt, bcrypt);
const courseRoutes = require('./routes/courses')(pool);
const groupRoutes = require('./routes/groups')(pool);
const assessmentRoutes = require('./routes/assessments')(pool);
const userRoutes = require('./routes/users')(pool); // Add this line

// Use routes
app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/groups', groupRoutes);
app.use('/assessments', assessmentRoutes);
app.use('/users', userRoutes); // Add this line

// Root route for API health check
app.get('/health', (req, res) => {
  res.json({ message: 'Assessment API is running' });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Check database connection first
  const dbConnected = await testDatabaseConnection();

  if (!dbConnected) {
    console.error('Server startup aborted due to database connection issues.');
    process.exit(1);
  }

  // Now that we know the database is connected, start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Start server
startServer();

module.exports = app;
