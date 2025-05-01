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

  // Get all groups (filtered by course if courseId is provided)
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const conn = await pool.getConnection();
      const { courseId } = req.query;

      let query, params;

      if (req.user.role === 'teacher' || req.user.role === 'admin') {
        // Teachers see all groups or groups for a specific course
        if (courseId) {
          query = `
            SELECT g.*, c.name as course_name,
                   (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id) as student_count
            FROM groups g
            JOIN courses c ON g.course_id = c.id
            WHERE g.course_id = ?
            ORDER BY g.name`;
          params = [courseId];
        } else {
          query = `
            SELECT g.*, c.name as course_name,
                   (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id) as student_count
            FROM groups g
            JOIN courses c ON g.course_id = c.id
            ORDER BY c.name, g.name`;
          params = [];
        }
      } else {
        // Students see only groups they're in
        if (courseId) {
          query = `
            SELECT g.*, c.name as course_name,
                   (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id) as student_count
            FROM groups g
            JOIN courses c ON g.course_id = c.id
            JOIN group_students gs ON g.id = gs.group_id
            WHERE gs.student_id = ? AND g.course_id = ?
            ORDER BY g.name`;
          params = [req.user.id, courseId];
        } else {
          query = `
            SELECT g.*, c.name as course_name,
                   (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id) as student_count
            FROM groups g
            JOIN courses c ON g.course_id = c.id
            JOIN group_students gs ON g.id = gs.group_id
            WHERE gs.student_id = ?
            ORDER BY c.name, g.name`;
          params = [req.user.id];
        }
      }

      const [rows] = await conn.execute(query, params);
      conn.release();

      res.json(rows);
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get a single group by ID
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const conn = await pool.getConnection();

      // Get basic group info
      const [groupRows] = await conn.execute(
        `SELECT g.*, c.name as course_name
         FROM groups g
         JOIN courses c ON g.course_id = c.id
         WHERE g.id = ?`,
        [id]
      );

      if (groupRows.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Group not found' });
      }

      const group = groupRows[0];

      // Check if user has access to this group
      if (req.user.role === 'student') {
        const [access] = await conn.execute(
          'SELECT 1 FROM group_students WHERE group_id = ? AND student_id = ?',
          [id, req.user.id]
        );

        if (access.length === 0) {
          // Check if student is in the course
          const [courseAccess] = await conn.execute(
            'SELECT 1 FROM course_students WHERE course_id = ? AND student_id = ?',
            [group.course_id, req.user.id]
          );

          if (courseAccess.length === 0) {
            conn.release();
            return res.status(403).json({ message: 'You do not have access to this group' });
          }
        }
      } else if (req.user.role === 'teacher') {
        // Check if teacher teaches this course
        const [teacherAccess] = await conn.execute(
          'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
          [group.course_id, req.user.id]
        );

        if (teacherAccess.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'You do not teach this course' });
        }
      }

      // Get students in the group
      const [students] = await conn.execute(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.q_number
         FROM users u
         JOIN group_students gs ON u.id = gs.student_id
         WHERE gs.group_id = ?
         ORDER BY u.last_name, u.first_name`,
        [id]
      );

      // Get assessments for this group
      const [assessments] = await conn.execute(
        `SELECT id, title, description, due_date
         FROM assessments
         WHERE group_id = ?
         ORDER BY due_date DESC`,
        [id]
      );

      conn.release();

      res.json({
        ...group,
        students,
        assessments
      });
    } catch (error) {
      console.error('Error fetching group:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create a new group (teachers only)
  router.post('/', authenticateToken, async (req, res) => {
    try {
      // Only teachers or admins can create groups
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can create groups' });
      }

      const { name, courseId, studentIds } = req.body;

      if (!name || !courseId) {
        return res.status(400).json({ message: 'Name and course ID are required' });
      }

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // Check if user is a teacher of this course
        if (req.user.role === 'teacher') {
          const [isTeacher] = await conn.execute(
            'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
            [courseId, req.user.id]
          );

          if (isTeacher.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(403).json({ message: 'You are not a teacher of this course' });
          }
        }

        // Create group
        const [result] = await conn.execute(
          'INSERT INTO groups (name, course_id) VALUES (?, ?)',
          [name, courseId]
        );

        const groupId = result.insertId;

        // Add students to group if provided
        if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
          for (const studentId of studentIds) {
            // Check if student is in the course
            const [isCourseStudent] = await conn.execute(
              'SELECT 1 FROM course_students WHERE course_id = ? AND student_id = ?',
              [courseId, studentId]
            );

            if (isCourseStudent.length === 0) {
              continue; // Skip students who aren't in the course
            }

            await conn.execute(
              'INSERT INTO group_students (group_id, student_id) VALUES (?, ?)',
              [groupId, studentId]
            );
          }
        }

        await conn.commit();
        conn.release();

        res.status(201).json({
          id: groupId,
          name,
          courseId,
          message: 'Group created successfully'
        });
      } catch (error) {
        await conn.rollback();
        conn.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update a group (teachers only)
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      // Only teachers or admins can update groups
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can update groups' });
      }

      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      const conn = await pool.getConnection();

      // Get group info to check permissions
      const [groupInfo] = await conn.execute(
        'SELECT course_id FROM groups WHERE id = ?',
        [id]
      );

      if (groupInfo.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Group not found' });
      }

      // Check if user is a teacher of this course
      if (req.user.role === 'teacher') {
        const [isTeacher] = await conn.execute(
          'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
          [groupInfo[0].course_id, req.user.id]
        );

        if (isTeacher.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'You are not a teacher of this course' });
        }
      }

      // Update group
      await conn.execute(
        'UPDATE groups SET name = ? WHERE id = ?',
        [name, id]
      );

      conn.release();

      res.json({ message: 'Group updated successfully' });
    } catch (error) {
      console.error('Error updating group:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Add a student to a group
  router.post('/:id/students', authenticateToken, async (req, res) => {
    try {
      // Only teachers can add students to groups
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can add students to groups' });
      }

      const { id } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required' });
      }

      const conn = await pool.getConnection();

      // Get group info to check permissions
      const [groupInfo] = await conn.execute(
        'SELECT course_id FROM groups WHERE id = ?',
        [id]
      );

      if (groupInfo.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Group not found' });
      }

      // Check if user is a teacher of this course
      if (req.user.role === 'teacher') {
        const [isTeacher] = await conn.execute(
          'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
          [groupInfo[0].course_id, req.user.id]
        );

        if (isTeacher.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'You are not a teacher of this course' });
        }
      }

      // Check if student is in the course
      const [isCourseStudent] = await conn.execute(
        'SELECT 1 FROM course_students WHERE course_id = ? AND student_id = ?',
        [groupInfo[0].course_id, studentId]
      );

      if (isCourseStudent.length === 0) {
        conn.release();
        return res.status(400).json({ message: 'Student is not enrolled in this course' });
      }

      // Check if student is already in the group
      const [isGroupMember] = await conn.execute(
        'SELECT 1 FROM group_students WHERE group_id = ? AND student_id = ?',
        [id, studentId]
      );

      if (isGroupMember.length > 0) {
        conn.release();
        return res.status(400).json({ message: 'Student is already in this group' });
      }

      // Add student to group
      await conn.execute(
        'INSERT INTO group_students (group_id, student_id) VALUES (?, ?)',
        [id, studentId]
      );

      conn.release();

      res.status(201).json({ message: 'Student added to group successfully' });
    } catch (error) {
      console.error('Error adding student to group:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Remove a student from a group
  router.delete('/:id/students/:studentId', authenticateToken, async (req, res) => {
    try {
      // Only teachers can remove students from groups
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can remove students from groups' });
      }

      const { id, studentId } = req.params;

      const conn = await pool.getConnection();

      // Get group info to check permissions
      const [groupInfo] = await conn.execute(
        'SELECT course_id FROM groups WHERE id = ?',
        [id]
      );

      if (groupInfo.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Group not found' });
      }

      // Check if user is a teacher of this course
      if (req.user.role === 'teacher') {
        const [isTeacher] = await conn.execute(
          'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
          [groupInfo[0].course_id, req.user.id]
        );

        if (isTeacher.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'You are not a teacher of this course' });
        }
      }

      // Remove student from group
      await conn.execute(
        'DELETE FROM group_students WHERE group_id = ? AND student_id = ?',
        [id, studentId]
      );

      conn.release();

      res.json({ message: 'Student removed from group successfully' });
    } catch (error) {
      console.error('Error removing student from group:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get available students for a group (students in the course but not in the group)
  router.get('/:id/available-students', authenticateToken, async (req, res) => {
    try {
      // Only teachers can see available students
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can view available students' });
      }

      const { id } = req.params;
      const conn = await pool.getConnection();

      // Get course_id for this group
      const [groupInfo] = await conn.execute(
        'SELECT course_id FROM groups WHERE id = ?',
        [id]
      );

      if (groupInfo.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Group not found' });
      }

      const courseId = groupInfo[0].course_id;

      // Check if user is a teacher of this course
      if (req.user.role === 'teacher') {
        const [isTeacher] = await conn.execute(
          'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
          [courseId, req.user.id]
        );

        if (isTeacher.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'You are not a teacher of this course' });
        }
      }

      // Get students who are in the course but not in the group
      const [students] = await conn.execute(`
        SELECT u.id, u.first_name, u.last_name, u.email, u.q_number
        FROM users u
        JOIN course_students cs ON u.id = cs.student_id
        WHERE cs.course_id = ?
        AND u.id NOT IN (
          SELECT student_id FROM group_students WHERE group_id = ?
        )
        ORDER BY u.last_name, u.first_name
      `, [courseId, id]);

      conn.release();
      res.json(students);
    } catch (error) {
      console.error('Error fetching available students:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete a group (teachers only)
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      // Only teachers or admins can delete groups
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can delete groups' });
      }

      const { id } = req.params;
      const conn = await pool.getConnection();

      // Begin transaction to ensure all related data is properly cleaned up
      await conn.beginTransaction();

      try {
        // Get group info to check permissions
        const [groupInfo] = await conn.execute(
          'SELECT course_id FROM groups WHERE id = ?',
          [id]
        );

        if (groupInfo.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is a teacher of this course
        if (req.user.role === 'teacher') {
          const [isTeacher] = await conn.execute(
            'SELECT 1 FROM course_teachers WHERE course_id = ? AND teacher_id = ?',
            [groupInfo[0].course_id, req.user.id]
          );

          if (isTeacher.length === 0) {
            await conn.rollback();
            conn.release();
            return res.status(403).json({ message: 'You are not a teacher of this course' });
          }
        }

        // Check if there are any assessments for this group
        const [assessments] = await conn.execute(
          'SELECT id FROM assessments WHERE group_id = ?',
          [id]
        );

        // Delete assessment results
        if (assessments.length > 0) {
          for (const assessment of assessments) {
            // Delete assessment criteria
            await conn.execute(
              'DELETE FROM assessment_criteria WHERE assessment_id = ?',
              [assessment.id]
            );

            // Delete assessment results
            await conn.execute(
              'DELETE FROM assessment_results WHERE assessment_id = ?',
              [assessment.id]
            );

            // Delete assessment submissions
            await conn.execute(
              'DELETE FROM assessment_submissions WHERE assessment_id = ?',
              [assessment.id]
            );
          }

          // Delete assessments
          await conn.execute(
            'DELETE FROM assessments WHERE group_id = ?',
            [id]
          );
        }

        // Delete all students from the group
        await conn.execute(
          'DELETE FROM group_students WHERE group_id = ?',
          [id]
        );

        // Finally delete the group itself
        await conn.execute(
          'DELETE FROM groups WHERE id = ?',
          [id]
        );

        // Commit all changes
        await conn.commit();
        conn.release();

        res.json({ message: 'Group deleted successfully' });
      } catch (error) {
        await conn.rollback();
        conn.release();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
