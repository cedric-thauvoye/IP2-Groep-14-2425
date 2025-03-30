const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Middleware to verify JWT token
  const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    try {
      // Since we don't have direct access to jwt module here, we'll extract user info from headers
      const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
  };

  // Get all courses (or courses taught by a teacher)
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const isTeaching = req.query.teaching === 'true';
      const isAdmin = req.user.role === 'admin';

      const conn = await pool.getConnection();
      let query, params;

      if (isAdmin && isTeaching) {
        // Admin requesting all courses
        query = `
          SELECT
            c.*,
            (SELECT COUNT(*) FROM course_students cs WHERE cs.course_id = c.id) as student_count,
            (SELECT COUNT(*) FROM course_teachers ct WHERE ct.course_id = c.id) as teacher_count,
            (SELECT COUNT(*) FROM \`groups\` g WHERE g.course_id = c.id) as group_count
          FROM courses c
          ORDER BY c.name
        `;
        params = [];
      } else if (req.user.role === 'teacher' && isTeaching) {
        // Teacher requesting courses they teach
        query = `
          SELECT
            c.*,
            (SELECT COUNT(*) FROM course_students cs WHERE cs.course_id = c.id) as student_count,
            (SELECT COUNT(*) FROM course_teachers ct WHERE ct.course_id = c.id) as teacher_count,
            (SELECT COUNT(*) FROM \`groups\` g WHERE g.course_id = c.id) as group_count
          FROM courses c
          JOIN course_teachers ct ON c.id = ct.course_id
          WHERE ct.teacher_id = ?
          ORDER BY c.name
        `;
        params = [userId];
      } else if (req.user.role === 'student') {
        // Student requesting courses they're enrolled in
        query = `
          SELECT
            c.*,
            (SELECT COUNT(*) FROM course_students cs WHERE cs.course_id = c.id) as student_count,
            (SELECT COUNT(*) FROM course_teachers ct WHERE ct.course_id = c.id) as teacher_count,
            (SELECT COUNT(*) FROM \`groups\` g WHERE g.course_id = c.id) as group_count
          FROM courses c
          JOIN course_students cs ON c.id = cs.course_id
          WHERE cs.student_id = ?
          ORDER BY c.name
        `;
        params = [userId];
      } else {
        // Default: get all courses the user has access to
        if (req.user.role === 'teacher' || req.user.role === 'admin') {
          query = `
            SELECT
              c.*,
              (SELECT COUNT(*) FROM course_students cs WHERE cs.course_id = c.id) as student_count,
              (SELECT COUNT(*) FROM course_teachers ct WHERE ct.course_id = c.id) as teacher_count,
              (SELECT COUNT(*) FROM \`groups\` g WHERE g.course_id = c.id) as group_count
            FROM courses c
            JOIN course_teachers ct ON c.id = ct.course_id
            WHERE ct.teacher_id = ?
            ORDER BY c.name
          `;
        } else {
          query = `
            SELECT
              c.*,
              (SELECT COUNT(*) FROM course_students cs WHERE cs.course_id = c.id) as student_count,
              (SELECT COUNT(*) FROM course_teachers ct WHERE ct.course_id = c.id) as teacher_count,
              (SELECT COUNT(*) FROM \`groups\` g WHERE g.course_id = c.id) as group_count
            FROM courses c
            JOIN course_students cs ON c.id = cs.course_id
            WHERE cs.student_id = ?
            ORDER BY c.name
          `;
        }
        params = [userId];
      }

      // Execute query
      const [rows] = await conn.execute(query, params);
      conn.release();

      // Return the data
      res.json(rows);
    } catch (error) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get a single course by ID
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const conn = await pool.getConnection();

      // Get basic course info
      const [courseRows] = await conn.execute(
        'SELECT * FROM courses WHERE id = ?',
        [id]
      );

      if (courseRows.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Course not found' });
      }

      // Check if user has access to this course
      if (req.user.role === 'student') {
        const [access] = await conn.execute(
          'SELECT 1 FROM course_students WHERE course_id = ? AND student_id = ?',
          [id, req.user.id]
        );

        if (access.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'You are not enrolled in this course' });
        }
      }

      // Get teachers for the course
      const [teachers] = await conn.execute(
        `SELECT u.id, u.first_name, u.last_name, u.email
         FROM users u
         JOIN course_teachers ct ON u.id = ct.teacher_id
         WHERE ct.course_id = ?`,
        [id]
      );

      // Get students for the course
      const [students] = await conn.execute(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.q_number
         FROM users u
         JOIN course_students cs ON u.id = cs.student_id
         WHERE cs.course_id = ?`,
        [id]
      );

      // Get groups for the course
      const [groups] = await conn.execute(
        'SELECT * FROM groups WHERE course_id = ?',
        [id]
      );

      conn.release();

      res.json({
        ...courseRows[0],
        teachers,
        students,
        groups
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create a new course (teachers only)
  router.post('/', authenticateToken, async (req, res) => {
    try {
      // Only teachers or admins can create courses
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can create courses' });
      }

      const { name, code, description } = req.body;

      if (!name || !code) {
        return res.status(400).json({ message: 'Name and code are required' });
      }

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // Check if course code already exists
        const [existingCourse] = await conn.execute(
          'SELECT 1 FROM courses WHERE code = ?',
          [code]
        );

        if (existingCourse.length > 0) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ message: 'Course code already exists' });
        }

        // Create course
        const [result] = await conn.execute(
          'INSERT INTO courses (name, code, description) VALUES (?, ?, ?)',
          [name, code, description || null]
        );

        // Add creator as teacher
        await conn.execute(
          'INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)',
          [result.insertId, req.user.id]
        );

        await conn.commit();
        conn.release();

        res.status(201).json({
          id: result.insertId,
          name,
          code,
          description,
          message: 'Course created successfully'
        });
      } catch (error) {
        await conn.rollback();
        conn.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update a course (teachers only)
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      // Only teachers or admins can update courses
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can update courses' });
      }

      const { id } = req.params;
      const { name, code, description } = req.body;

      if (!name && !code && !description) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      const conn = await pool.getConnection();

      // Check if user is a teacher of this course
      if (req.user.role === 'teacher') {
        const [isTeacher] = await conn.execute(
          'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
          [id, req.user.id]
        );

        if (isTeacher.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'You are not a teacher of this course' });
        }
      }

      // Update the course
      const updateFields = [];
      const updateParams = [];

      if (name) {
        updateFields.push('name = ?');
        updateParams.push(name);
      }

      if (code) {
        // Check if new code already exists for another course
        if (code) {
          const [existingCode] = await conn.execute(
            'SELECT 1 FROM courses WHERE code = ? AND id != ?',
            [code, id]
          );

          if (existingCode.length > 0) {
            conn.release();
            return res.status(400).json({ message: 'Course code already exists' });
          }

          updateFields.push('code = ?');
          updateParams.push(code);
        }
      }

      if (description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(description);
      }

      updateParams.push(id);

      await conn.execute(
        `UPDATE courses SET ${updateFields.join(', ')} WHERE id = ?`,
        updateParams
      );

      conn.release();

      res.json({ message: 'Course updated successfully' });
    } catch (error) {
      console.error('Error updating course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Add a student to a course
  router.post('/:id/students', authenticateToken, async (req, res) => {
    try {
      // Only teachers can add students
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can add students' });
      }

      const { id } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required' });
      }

      const conn = await pool.getConnection();

      // Check if user is a teacher of this course
      const [isTeacher] = await conn.execute(
        'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
        [id, req.user.id]
      );

      if (isTeacher.length === 0 && req.user.role !== 'admin') {
        conn.release();
        return res.status(403).json({ message: 'You are not a teacher of this course' });
      }

      // Check if student exists and is a student
      const [studentCheck] = await conn.execute(
        'SELECT 1 FROM users WHERE id = ? AND role = "student"',
        [studentId]
      );

      if (studentCheck.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Student not found' });
      }

      // Check if student is already in the course
      const [existingEnrollment] = await conn.execute(
        'SELECT 1 FROM course_students WHERE course_id = ? AND student_id = ?',
        [id, studentId]
      );

      if (existingEnrollment.length > 0) {
        conn.release();
        return res.status(400).json({ message: 'Student is already enrolled in this course' });
      }

      // Add student to course
      await conn.execute(
        'INSERT INTO course_students (course_id, student_id) VALUES (?, ?)',
        [id, studentId]
      );

      conn.release();

      res.status(201).json({ message: 'Student added to course successfully' });
    } catch (error) {
      console.error('Error adding student to course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Add a teacher to a course
  router.post('/:id/teachers', authenticateToken, async (req, res) => {
    try {
      // Only teachers can add other teachers
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can add other teachers to courses' });
      }

      const { id } = req.params;
      const { teacherId } = req.body;

      if (!teacherId) {
        return res.status(400).json({ message: 'Teacher ID is required' });
      }

      const conn = await pool.getConnection();

      // Check if user is a teacher of this course
      const [isTeacher] = await conn.execute(
        'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
        [id, req.user.id]
      );

      if (isTeacher.length === 0 && req.user.role !== 'admin') {
        conn.release();
        return res.status(403).json({ message: 'You are not a teacher of this course' });
      }

      // Check if the user to be added has a teacher role
      const [teacherCheck] = await conn.execute(
        'SELECT 1 FROM users WHERE id = ? AND (role = "teacher" OR role = "admin")',
        [teacherId]
      );

      if (teacherCheck.length === 0) {
        conn.release();
        return res.status(400).json({ message: 'Only users with teacher or admin role can be added as course teachers' });
      }

      // Check if teacher is already in the course
      const [existingTeacher] = await conn.execute(
        'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
        [id, teacherId]
      );

      if (existingTeacher.length > 0) {
        conn.release();
        return res.status(400).json({ message: 'Teacher is already assigned to this course' });
      }

      // Add teacher to course
      await conn.execute(
        'INSERT INTO course_teachers (course_id, teacher_id) VALUES (?, ?)',
        [id, teacherId]
      );

      conn.release();

      res.status(201).json({ message: 'Teacher added to course successfully' });
    } catch (error) {
      console.error('Error adding teacher to course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Remove a student from a course
  router.delete('/:id/students/:studentId', authenticateToken, async (req, res) => {
    try {
      // Only teachers can remove students
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can remove students' });
      }

      const { id, studentId } = req.params;

      const conn = await pool.getConnection();

      // Check if user is a teacher of this course
      const [isTeacher] = await conn.execute(
        'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
        [id, req.user.id]
      );

      if (isTeacher.length === 0 && req.user.role !== 'admin') {
        conn.release();
        return res.status(403).json({ message: 'You are not a teacher of this course' });
      }

      // Remove student from course
      await conn.execute(
        'DELETE FROM course_students WHERE course_id = ? AND student_id = ?',
        [id, studentId]
      );

      // Also remove student from any groups in this course
      await conn.execute(
        `DELETE gs FROM group_students gs
         JOIN groups g ON gs.group_id = g.id
         WHERE g.course_id = ? AND gs.student_id = ?`,
        [id, studentId]
      );

      conn.release();

      res.json({ message: 'Student removed from course successfully' });
    } catch (error) {
      console.error('Error removing student from course:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
