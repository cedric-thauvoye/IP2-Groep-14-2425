const express = require('express');
const axios = require('axios');

module.exports = (pool, jwt, bcrypt) => {
  const router = express.Router();

  // Check if JWT_SECRET is set
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('WARNING: JWT_SECRET is not set. Authentication will fail.');
  }

  // Middleware to verify JWT token
  const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    // Verify JWT_SECRET is set
    if (!JWT_SECRET) {
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
    }

    try {
      const user = jwt.verify(token, JWT_SECRET);
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
  };

  // Login route
  router.post('/login', async (req, res) => {
    try {
      // Verify JWT_SECRET is set
      if (!JWT_SECRET) {
        return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
      }

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
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Register route
  router.post('/register', async (req, res) => {
    try {
      // Verify JWT_SECRET is set
      if (!JWT_SECRET) {
        return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
      }

      const { email, password, firstName, lastName, role = 'student' } = req.body;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const conn = await pool.getConnection();

      // Check if user already exists
      const [existingUser] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);

      if (existingUser.length > 0) {
        conn.release();
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const [result] = await conn.execute(
        'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, firstName, lastName, role]
      );

      conn.release();

      const token = jwt.sign(
        { id: result.insertId, email, role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: { id: result.insertId, email, firstName, lastName, role }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Microsoft authentication route
  router.post('/microsoft', async (req, res) => {
    try {
      // Verify JWT_SECRET is set
      if (!JWT_SECRET) {
        return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is not set' });
      }

      const { token: msalToken } = req.body; // Rename to msalToken to avoid conflict

      if (!msalToken) {
        return res.status(400).json({ message: 'Microsoft token is required' });
      }

      // Verify the token with Microsoft Graph API
      const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${msalToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!graphResponse.data || !graphResponse.data.mail) {
        return res.status(400).json({ message: 'Invalid Microsoft token or missing email' });
      }

      const microsoftUser = graphResponse.data;
      const email = microsoftUser.mail || microsoftUser.userPrincipalName;

      // Only allow emails from specific domain (e.g., odisee.be)
      if (!email.toLowerCase().endsWith('@odisee.be') && !email.toLowerCase().endsWith('@student.odisee.be')) {
        return res.status(403).json({ message: 'Only Odisee accounts are allowed' });
      }

      const conn = await pool.getConnection();

      // Check if user exists
      let [rows] = await conn.execute('SELECT * FROM users WHERE email = ?', [email]);

      let user;

      if (rows.length === 0) {
        // Create new user based on Microsoft data
        const firstName = microsoftUser.givenName || '';
        const lastName = microsoftUser.surname || '';

        // Determine if student or teacher based on email domain
        const role = email.toLowerCase().includes('student') ? 'student' : 'teacher';

        // Generate a q_number for students to satisfy the constraint
        // For emails like student@student.odisee.be, extract username as q-number
        // If not possible, create a placeholder q-number
        let qNumber = null;
        if (role === 'student') {
          // Try to extract q-number from email or generate one
          const emailParts = email.split('@');
          if (emailParts.length > 0 && emailParts[0].toLowerCase().startsWith('q')) {
            qNumber = emailParts[0];
          } else {
            // Create a placeholder q-number using timestamp
            qNumber = `q${Date.now().toString().substring(7)}`;
          }
        }

        // Generate a random password (not needed for Microsoft users, but required in our schema)
        const randomPassword = Math.random().toString(36).slice(-12);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        // Create the user - include q_number for students
        const [result] = await conn.execute(
          'INSERT INTO users (email, password, first_name, last_name, role, q_number) VALUES (?, ?, ?, ?, ?, ?)',
          [email, hashedPassword, firstName, lastName, role, qNumber]
        );

        [rows] = await conn.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
        user = rows[0];
      } else {
        user = rows[0];
      }

      conn.release();

      // Generate JWT token
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log("USERRR:", user.first_name)

      return res.json({
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Microsoft authentication error:', error);
      return res.status(500).json({ message: 'Server error during Microsoft authentication' });
    }
  });

  // Get current user
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      // Instead of just returning the token data, fetch the user from the database
      const userId = req.user.id;
      const conn = await pool.getConnection();

      // Fetch user with all relevant details
      const [rows] = await conn.execute(
        `SELECT id, email, first_name, last_name, role, q_number
         FROM users
         WHERE id = ?`,
        [userId]
      );

      conn.release();

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = rows[0];

      // Add debug logging
      console.log('User data fetched from database:', user);

      // Return full user data including firstName/lastName for consistency
      res.json({
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          q_number: user.q_number
        }
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Server error while fetching user data' });
    }
  });

  // Get user role
  router.get('/role', authenticateToken, (req, res) => {
    res.json({ role: req.user.role });
  });

  // Logout route (client-side logout, just for API completeness)
  router.post('/logout', (req, res) => {
    // No server-side action needed as we're using JWTs
    // Client should remove the token from localStorage
    res.json({ message: 'Logged out successfully' });
  });

  return router;
};
