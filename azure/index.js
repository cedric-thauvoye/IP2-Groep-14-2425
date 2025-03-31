const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: {
    rejectUnauthorized: true
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }
};

// Auth Routes
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const conn = await pool.getConnection();

    const [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);
    conn.release();

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// User Routes
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/auth/role', authenticateToken, (req, res) => {
  res.json({ role: req.user.role });
});

// Assessment Routes
app.get('/assessments/pending', authenticateToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      `SELECT a.*, c.name as courseName
       FROM assessments a
       JOIN courses c ON a.course_id = c.id
       JOIN user_assessments ua ON a.id = ua.assessment_id
       WHERE ua.user_id = ? AND ua.completed = 0`,
      [req.user.id]
    );
    conn.release();

    const pendingAssessments = rows.map(row => ({
      id: row.id,
      title: row.title,
      courseName: row.courseName,
      description: row.description,
      dueDate: row.due_date,
      progress: row.progress || 0
    }));

    res.json(pendingAssessments);
  } catch (error) {
    console.error('Error fetching pending assessments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/assessments/completed', authenticateToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      `SELECT a.*, c.name as courseName, ua.completed_date, ua.score, ua.time_spent
       FROM assessments a
       JOIN courses c ON a.course_id = c.id
       JOIN user_assessments ua ON a.id = ua.assessment_id
       WHERE ua.user_id = ? AND ua.completed = 1`,
      [req.user.id]
    );
    conn.release();

    const completedAssessments = rows.map(row => ({
      id: row.id,
      title: row.title,
      courseName: row.courseName,
      description: row.description,
      completedDate: row.completed_date,
      score: row.score,
      timeSpent: row.time_spent || '0 min'
    }));

    res.json(completedAssessments);
  } catch (error) {
    console.error('Error fetching completed assessments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
