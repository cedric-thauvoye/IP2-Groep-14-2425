const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables from .env file
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Verify required env variables are set
const requiredEnvVars = ['VITE_MYSQL_HOST', 'VITE_MYSQL_USER', 'VITE_MYSQL_PASSWORD', 'VITE_MYSQL_DATABASE', 'VITE_JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please set these variables in your .env file or environment.');

  // Set default VITE_JWT_SECRET for development (not recommended for production)
  if (missingEnvVars.includes('VITE_JWT_SECRET') && process.env.NODE_ENV !== 'production') {
    console.warn('Setting a default VITE_JWT_SECRET for development. DO NOT use in production!');
    process.env.VITE_JWT_SECRET = 'default-development-secret-do-not-use-in-production';
  }
}

const app = express();

// Configure CORS with expanded allowed origins
const corsOptions = {
  origin: [
    // Local development origins
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost',

    // Production origins
    'https://ip2-app.thauvoye.net',
    'https://ip2-api.thauvoye.net',

    // Add the origin as a wildcard subdomain
    /^https:\/\/[\w-]+\.thauvoye\.net$/
  ],
  methods: 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Add CORS headers to responses if the preflight doesn't handle it
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept, X-Requested-With');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Parse JSON request body
app.use(bodyParser.json());

// Parse URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

// Create a database connection pool
const pool = mysql.createPool({
  host: process.env.VITE_MYSQL_HOST,
  user: process.env.VITE_MYSQL_USER,
  password: process.env.VITE_MYSQL_PASSWORD,
  database: process.env.VITE_MYSQL_DATABASE,
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

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
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
    console.log(`CORS enabled for origins:`, corsOptions.origin);
  });
};

// Start server
startServer();

module.exports = app;
