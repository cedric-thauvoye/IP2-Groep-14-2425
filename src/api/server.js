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

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '192.168.1.10',
  user: process.env.MYSQL_USER || 'peer_evaluation',
  password: process.env.MYSQL_PASSWORD || 'aX68d4t78sytHo4VaYck',
  database: process.env.MYSQL_DATABASE || 'peer_evaluation',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: true
  } : false
});

// Initialize the database if needed
const initializeDatabase = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Check if schema file exists
      const schemaPath = path.join(__dirname, 'database', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        const connection = await pool.getConnection();

        // Split schema into individual statements
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim() !== '');

        for (const statement of statements) {
          if (statement.trim()) {
            await connection.query(statement + ';');
          }
        }

        connection.release();
        console.log('Database schema initialized');
      }
    } catch (error) {
      console.error('Error initializing database schema:', error);
    }
  }
};

// Test database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database');
    connection.release();

    // Initialize database if needed
    await initializeDatabase();
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
})();

// Import route modules
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessments');
const courseRoutes = require('./routes/courses');
const groupRoutes = require('./routes/groups');

// Use routes
app.use('/api/auth', authRoutes(pool, jwt, bcrypt));
app.use('/api/assessments', assessmentRoutes(pool));
app.use('/api/courses', courseRoutes(pool));
app.use('/api/groups', groupRoutes(pool));

// Root route for API health check
app.get('/api', (req, res) => {
  res.json({ message: 'Assessment API is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
