const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Middleware to verify JWT token
  const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    try {
      // Since we don't have direct access to jwt module here, extract user info from headers
      const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
  };

  // Get users with role filter
  router.get('/', authenticateToken, async (req, res) => {
    try {
      // Only teachers or admins can access user lists
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers and admins can access this resource' });
      }

      const { role } = req.query;
      const conn = await pool.getConnection();

      let query, params;

      if (role) {
        // Filter by role
        query = `
          SELECT id, email, first_name, last_name, role, q_number
          FROM users
          WHERE role = ?
          ORDER BY last_name, first_name`;
        params = [role];
      } else {
        // Get all users
        query = `
          SELECT id, email, first_name, last_name, role, q_number
          FROM users
          ORDER BY last_name, first_name`;
        params = [];
      }

      const [rows] = await conn.execute(query, params);
      conn.release();

      res.json(rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get teachers (for adding to courses)
  router.get('/teachers', authenticateToken, async (req, res) => {
    try {
      // Only teachers or admins can access user lists
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
      }

      const conn = await pool.getConnection();

      const [rows] = await conn.execute(`
        SELECT id, email, first_name, last_name
        FROM users
        WHERE role = 'teacher' OR role = 'admin'
        ORDER BY last_name, first_name
      `);

      conn.release();
      res.json(rows);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get students (for adding to courses/groups)
  router.get('/students', authenticateToken, async (req, res) => {
    try {
      // Only teachers or admins can access user lists
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized access' });
      }

      const conn = await pool.getConnection();

      const [rows] = await conn.execute(`
        SELECT id, email, first_name, last_name, q_number
        FROM users
        WHERE role = 'student'
        ORDER BY last_name, first_name
      `);

      conn.release();
      res.json(rows);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get all users (admin only)
  router.get('/all', authenticateToken, async (req, res) => {
    try {
      // Only admins can access all users with extra details
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const conn = await pool.getConnection();

      // Get users with course and group counts
      const [rows] = await conn.execute(`
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.role,
          u.q_number,
          u.created_at,
          (
            SELECT COUNT(*) FROM course_students cs
            WHERE cs.student_id = u.id
          ) + (
            SELECT COUNT(*) FROM course_teachers ct
            WHERE ct.teacher_id = u.id
          ) as course_count,
          (
            SELECT COUNT(*) FROM group_students gs
            WHERE gs.student_id = u.id
          ) as group_count
        FROM users u
        ORDER BY u.last_name, u.first_name
      `);

      conn.release();
      res.json(rows);
    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get a single user
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      // Only admins or teachers can access user details,
      // or users can access their own details
      if (req.user.role !== 'admin' && req.user.role !== 'teacher' && req.user.id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }

      const { id } = req.params;
      const conn = await pool.getConnection();

      // Get user details
      const [userRows] = await conn.execute(`
        SELECT id, email, first_name, last_name, role, q_number, created_at, updated_at
        FROM users
        WHERE id = ?
      `, [id]);

      if (userRows.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'User not found' });
      }

      const user = userRows[0];

      // Get courses the user is in
      let coursesQuery;
      if (user.role === 'student') {
        coursesQuery = `
          SELECT c.id, c.name, c.code
          FROM courses c
          JOIN course_students cs ON c.id = cs.course_id
          WHERE cs.student_id = ?
        `;
      } else {
        coursesQuery = `
          SELECT c.id, c.name, c.code
          FROM courses c
          JOIN course_teachers ct ON c.id = ct.course_id
          WHERE ct.teacher_id = ?
        `;
      }

      const [coursesRows] = await conn.execute(coursesQuery, [id]);

      // Get groups if the user is a student
      let groupsRows = [];
      if (user.role === 'student') {
        const [rows] = await conn.execute(`
          SELECT g.id, g.name, c.name AS course_name
          FROM \`groups\` g
          JOIN group_students gs ON g.id = gs.group_id
          JOIN courses c ON g.course_id = c.id
          WHERE gs.student_id = ?
        `, [id]);
        groupsRows = rows;
      }

      conn.release();

      res.json({
        ...user,
        courses: coursesRows,
        groups: groupsRows
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create a new user (admin only)
  router.post('/', authenticateToken, async (req, res) => {
    try {
      // Only admins can create users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { email, first_name, last_name, role, q_number, password } = req.body;

      // Validate required fields
      if (!email || !first_name || !last_name || !role || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate student has q_number
      if (role === 'student' && !q_number) {
        return res.status(400).json({ message: 'Students must have a Q-number' });
      }

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // Check if email already exists
        const [existingUser] = await conn.execute(
          'SELECT 1 FROM users WHERE email = ?',
          [email]
        );

        if (existingUser.length > 0) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ message: 'Email already in use' });
        }

        // Generate password hash
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await conn.execute(
          'INSERT INTO users (email, first_name, last_name, role, q_number, password) VALUES (?, ?, ?, ?, ?, ?)',
          [email, first_name, last_name, role, role === 'student' ? q_number : null, hashedPassword]
        );

        await conn.commit();
        conn.release();

        res.status(201).json({
          id: result.insertId,
          email,
          first_name,
          last_name,
          role,
          q_number: role === 'student' ? q_number : null,
          message: 'User created successfully'
        });
      } catch (error) {
        await conn.rollback();
        conn.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update a user (admin only)
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      // Only admins can update users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;
      const { email, first_name, last_name, role, q_number, password } = req.body;

      const conn = await pool.getConnection();

      // Get current user data
      const [currentUser] = await conn.execute(
        'SELECT role FROM users WHERE id = ?',
        [id]
      );

      if (currentUser.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'User not found' });
      }

      // Build update fields
      const updateFields = [];
      const updateParams = [];

      if (email) {
        // Check email uniqueness
        const [existingEmail] = await conn.execute(
          'SELECT 1 FROM users WHERE email = ? AND id != ?',
          [email, id]
        );

        if (existingEmail.length > 0) {
          conn.release();
          return res.status(400).json({ message: 'Email already in use' });
        }

        updateFields.push('email = ?');
        updateParams.push(email);
      }

      if (first_name) {
        updateFields.push('first_name = ?');
        updateParams.push(first_name);
      }

      if (last_name) {
        updateFields.push('last_name = ?');
        updateParams.push(last_name);
      }

      if (role) {
        // Check if user is being changed from teacher to student and has courses
        if (currentUser[0].role === 'teacher' && role === 'student') {
          const [teacherCourses] = await conn.execute(
            'SELECT 1 FROM course_teachers WHERE teacher_id = ?',
            [id]
          );

          if (teacherCourses.length > 0) {
            conn.release();
            return res.status(400).json({
              message: 'Cannot change role to student: user is a teacher for one or more courses'
            });
          }
        }

        updateFields.push('role = ?');
        updateParams.push(role);
      }

      if (q_number !== undefined) {
        updateFields.push('q_number = ?');
        updateParams.push(q_number);
      }

      if (password) {
        // Generate new password hash
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        updateFields.push('password = ?');
        updateParams.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        conn.release();
        return res.status(400).json({ message: 'No fields to update' });
      }

      // Add id to params
      updateParams.push(id);

      // Update user
      await conn.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateParams
      );

      conn.release();

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete a user (admin only)
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      // Only admins can delete users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { id } = req.params;

      // Cannot delete yourself
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
      }

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // Check if user exists
        const [user] = await conn.execute('SELECT 1 FROM users WHERE id = ?', [id]);

        if (user.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(404).json({ message: 'User not found' });
        }

        // Delete user and all related data
        await conn.execute('DELETE FROM users WHERE id = ?', [id]);

        await conn.commit();
        conn.release();

        res.json({ message: 'User deleted successfully' });
      } catch (error) {
        await conn.rollback();
        conn.release();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Verify password (for secure operations)
  router.post('/verify-password', authenticateToken, async (req, res) => {
    try {
      // Only admins can use this endpoint
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }

      const conn = await pool.getConnection();

      // Get user's stored hash
      const [user] = await conn.execute(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id]
      );

      conn.release();

      if (user.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify password
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(password, user[0].password);

      res.json({ valid: isValid });
    } catch (error) {
      console.error('Error verifying password:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
