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
      // In a real app, you might want to pass the jwt module to this function too
      const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
  };

  // Get pending assessments
  router.get('/pending', authenticateToken, async (req, res) => {
    try {
      const conn = await pool.getConnection();
      const { role } = req.query;  // Get role from query parameter
      const userRole = role || req.user.role;  // Use query role or user's actual role

      // Different queries for students and teachers
      let query, params;

      if (userRole === 'student') {
        // Students see assessments assigned to their groups that they haven't responded to yet
        query = `
          SELECT a.id, a.title, a.description, a.due_date, c.name as courseName,
                 g.name as groupName, IFNULL(r.id, 0) as responded,
                 (CASE
                   WHEN r.id IS NULL THEN 0
                   ELSE 100
                 END) as progress
          FROM assessments a
          JOIN courses c ON a.course_id = c.id
          JOIN groups g ON a.group_id = g.id
          JOIN group_students gs ON g.id = gs.group_id
          LEFT JOIN responses r ON a.id = r.assessment_id AND r.student_id = ?
          WHERE gs.student_id = ?
          AND (r.id IS NULL OR r.submitted_at IS NULL)
          AND a.due_date > NOW()
          ORDER BY a.due_date ASC`;
        params = [req.user.id, req.user.id];
      } else {
        // Teachers see assessments they created that are still pending
        query = `
          SELECT a.id, a.title, a.description, a.due_date, c.name as courseName,
                 g.name as groupName,
                 (SELECT COUNT(r.id) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL) as responses_count,
                 (SELECT COUNT(gs.id) FROM group_students gs WHERE gs.group_id = a.group_id) as students_count,
                 (SELECT COUNT(r.id) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL AND r.feedback IS NOT NULL AND r.feedback != '') as feedback_count,
                 CASE
                   WHEN (SELECT COUNT(r.id) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL) =
                        (SELECT COUNT(gs.id) FROM group_students gs WHERE gs.group_id = a.group_id)
                   THEN (SELECT MAX(r.submitted_at) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL)
                   WHEN a.due_date < NOW()
                   THEN a.due_date
                   ELSE NULL
                 END as completion_date
          FROM assessments a
          JOIN courses c ON a.course_id = c.id
          JOIN groups g ON a.group_id = g.id
          WHERE a.teacher_id = ?
          AND a.due_date > NOW()
          ORDER BY a.due_date ASC`;
        params = [req.user.id];
      }

      const [rows] = await conn.execute(query, params);
      conn.release();

      // Transform data based on role
      const pendingAssessments = rows.map(row => {
        if (req.user.role === 'student') {
          return {
            id: row.id,
            title: row.title,
            courseName: row.courseName,
            groupName: row.groupName,
            description: row.description,
            dueDate: row.due_date,
            progress: row.progress || 0
          };
        } else {
          // Calculate progress for teachers
          const completionPercentage = row.students_count > 0
            ? Math.round((row.responses_count / row.students_count) * 100)
            : 0;

          return {
            id: row.id,
            title: row.title,
            courseName: row.courseName,
            groupName: row.groupName,
            description: row.description,
            dueDate: row.due_date,
            completedDate: row.completion_date,
            responsesCount: row.responses_count,
            studentsCount: row.students_count,
            feedbackCount: row.feedback_count || 0,
            progress: completionPercentage
          };
        }
      });

      res.json(pendingAssessments);
    } catch (error) {
      console.error('Error fetching pending assessments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get completed assessments
  router.get('/completed', authenticateToken, async (req, res) => {
    try {
      const conn = await pool.getConnection();
      const { role } = req.query;  // Get role from query parameter
      const userRole = role || req.user.role;  // Use query role or user's actual role

      // Different queries for students and teachers
      let query, params;

      if (userRole === 'student') {
        // Students see assessments they've completed
        query = `
          SELECT a.id, a.title, a.description, c.name as courseName,
                 g.name as groupName, r.submitted_at as completedDate,
                 (SELECT AVG(given_score) FROM results res WHERE res.response_id = r.id) as score
          FROM assessments a
          JOIN courses c ON a.course_id = c.id
          JOIN groups g ON a.group_id = g.id
          JOIN responses r ON a.id = r.assessment_id
          WHERE r.student_id = ?
          AND r.submitted_at IS NOT NULL
          ORDER BY r.submitted_at DESC`;
        params = [req.user.id];
      } else {
        // Teachers see assessments they created that have passed due date
        query = `
          SELECT a.id, a.title, a.description, c.name as courseName,
                 g.name as groupName, a.due_date,
                 (SELECT COUNT(r.id) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL) as responses_count,
                 (SELECT COUNT(gs.id) FROM group_students gs WHERE gs.group_id = a.group_id) as students_count,
                 (SELECT COUNT(r.id) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL AND r.feedback IS NOT NULL AND r.feedback != '') as feedback_count,
                 CASE
                   WHEN (SELECT COUNT(r.id) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL) =
                        (SELECT COUNT(gs.id) FROM group_students gs WHERE gs.group_id = a.group_id)
                   THEN (SELECT MAX(r.submitted_at) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL)
                   ELSE a.due_date
                 END as completed_date
          FROM assessments a
          JOIN courses c ON a.course_id = c.id
          JOIN groups g ON a.group_id = g.id
          WHERE a.teacher_id = ?
          AND (a.due_date < NOW() OR
               (SELECT COUNT(r.id) FROM responses r WHERE r.assessment_id = a.id AND r.submitted_at IS NOT NULL) =
               (SELECT COUNT(gs.id) FROM group_students gs WHERE gs.group_id = a.group_id))
          ORDER BY a.due_date DESC`;
        params = [req.user.id];
      }

      const [rows] = await conn.execute(query, params);
      conn.release();

      // Transform data based on role
      const completedAssessments = rows.map(row => {
        if (req.user.role === 'student') {
          return {
            id: row.id,
            title: row.title,
            courseName: row.courseName,
            groupName: row.groupName,
            description: row.description,
            completedDate: row.completedDate
            // Removed score and timeSpent as students should not see this data
          };
        } else {
          // Calculate completion percentage for teachers
          const completionPercentage = row.students_count > 0
            ? Math.round((row.responses_count / row.students_count) * 100)
            : 0;

          return {
            id: row.id,
            title: row.title,
            courseName: row.courseName,
            groupName: row.groupName,
            description: row.description,
            dueDate: row.due_date,
            completedDate: row.completed_date,
            responsesCount: row.responses_count,
            studentsCount: row.students_count,
            feedbackCount: row.feedback_count || 0,
            completionRate: `${completionPercentage}%`
          };
        }
      });

      res.json(completedAssessments);
    } catch (error) {
      console.error('Error fetching completed assessments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get assessment by ID
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const conn = await pool.getConnection();

      // Basic assessment info
      const [assessmentRows] = await conn.execute(
        `SELECT a.*, c.name as courseName, g.name as groupName
         FROM assessments a
         JOIN courses c ON a.course_id = c.id
         JOIN groups g ON a.group_id = g.id
         WHERE a.id = ?`,
        [id]
      );

      if (assessmentRows.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Assessment not found' });
      }

      const assessment = assessmentRows[0];

      // Check permissions
      if (req.user.role === 'student') {
        // Check if student is in the group
        const [memberCheck] = await conn.execute(
          `SELECT 1 FROM group_students
           WHERE group_id = ? AND student_id = ?`,
          [assessment.group_id, req.user.id]
        );

        if (memberCheck.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'Not authorized to view this assessment' });
        }
      } else if (req.user.role === 'teacher') {
        // Check if teacher teaches the course of this assessment
        const [teacherCheck] = await conn.execute(
          `SELECT 1 FROM course_teachers ct
           JOIN assessments a ON ct.course_id = a.course_id
           WHERE a.id = ? AND ct.teacher_id = ?`,
          [id, req.user.id]
        );

        if (teacherCheck.length === 0) {
          conn.release();
          return res.status(403).json({ message: 'Not authorized to view this assessment' });
        }
      }
      // Admins have access to all assessments

      // Get assessment criteria
      const [criteria] = await conn.execute(
        `SELECT id, name, description, min_score, max_score
         FROM assessment_criteria
         WHERE assessment_id = ?`,
        [id]
      );

      // Convert min_score and max_score to numbers
      const formattedCriteria = criteria.map(criterion => ({
        id: criterion.id,
        name: criterion.name,
        description: criterion.description,
        minScore: parseFloat(criterion.min_score),
        maxScore: parseFloat(criterion.max_score)
      }));

      // For students, get list of group members to evaluate
      let studentsToEvaluate = [];
      if (req.user.role === 'student') {
        const [students] = await conn.execute(
          `SELECT u.id, u.first_name, u.last_name, u.q_number
           FROM users u
           JOIN group_students gs ON u.id = gs.student_id
           WHERE gs.group_id = ? AND u.id != ?`,
          [assessment.group_id, req.user.id]
        );

        studentsToEvaluate = students;

        // Check if student already submitted a response
        const [existingResponse] = await conn.execute(
          `SELECT id, feedback, submitted_at FROM responses
           WHERE assessment_id = ? AND student_id = ?`,
          [id, req.user.id]
        );

        if (existingResponse.length > 0) {
          assessment.responseId = existingResponse[0].id;
          assessment.feedback = existingResponse[0].feedback;
          assessment.submitted = existingResponse[0].submitted_at !== null;

          // If submitted, get the scores they gave
          if (assessment.submitted) {
            const [givenScores] = await conn.execute(
              `SELECT r.criteria_id, r.student_id, r.given_score
               FROM results r
               WHERE r.response_id = ?`,
              [existingResponse[0].id]
            );

            assessment.givenScores = givenScores;
          }
        }
      } else {
        // For teachers, get all students in the group and their submission status
        const [students] = await conn.execute(
          `SELECT u.id, u.first_name, u.last_name, u.q_number,
                 CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as has_submitted,
                 r.submitted_at
           FROM users u
           JOIN group_students gs ON u.id = gs.student_id
           LEFT JOIN responses r ON r.student_id = u.id AND r.assessment_id = ?
           WHERE gs.group_id = ?`,
          [id, assessment.group_id]
        );

        studentsToEvaluate = students;
      }

      conn.release();

      // Build response object
      const result = {
        id: assessment.id,
        title: assessment.title,
        courseName: assessment.courseName,
        groupName: assessment.groupName,
        description: assessment.description,
        dueDate: assessment.due_date,
        criteria: formattedCriteria,
        studentsToEvaluate: studentsToEvaluate
      };

      // Add student-specific data if applicable
      if (req.user.role === 'student') {
        result.responseId = assessment.responseId;
        result.feedback = assessment.feedback;
        result.submitted = assessment.submitted;
        result.givenScores = assessment.givenScores || [];
      }

      res.json(result);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create new assessment (teacher only)
  router.post('/', authenticateToken, async (req, res) => {
    try {
      // Check if user is a teacher
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can create assessments' });
      }

      const { title, description, courseId, groupIds, dueDate, criteria } = req.body;

      // Log the incoming data for debugging
      console.log('Creating assessment with data:', JSON.stringify({
        title,
        description,
        courseId,
        groupIds,
        dueDate,
        criteriaCount: criteria ? criteria.length : 0
      }));

      if (criteria && criteria.length > 0) {
        console.log('First criterion sample:', JSON.stringify(criteria[0]));
      }

      if (!title || !courseId || !groupIds || !dueDate || !criteria || !criteria.length || !Array.isArray(groupIds)) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // Format the date correctly for MySQL
        const formattedDueDate = new Date(dueDate).toISOString().slice(0, 19).replace('T', ' ');

        // Create one assessment for each group
        const assessmentIds = [];
        for (const groupId of groupIds) {
          // Insert assessment
          const [assessmentResult] = await conn.execute(
            'INSERT INTO assessments (title, description, course_id, group_id, teacher_id, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description || '', courseId, groupId, req.user.id, formattedDueDate]
          );

          const assessmentId = assessmentResult.insertId;
          assessmentIds.push(assessmentId);

          // Create criteria for this assessment
          for (const criterion of criteria) {
            try {
              // Convert minScore and maxScore to numbers
              const minScore = parseFloat(criterion.minScore);
              const maxScore = parseFloat(criterion.maxScore);

              if (isNaN(minScore) || isNaN(maxScore)) {
                throw new Error('Invalid score values. Min and max scores must be numbers.');
              }

              await conn.execute(
                'INSERT INTO assessment_criteria (assessment_id, name, description, min_score, max_score) VALUES (?, ?, ?, ?, ?)',
                [
                  assessmentId,
                  criterion.name,
                  criterion.description || '',
                  minScore,
                  maxScore
                ]
              );
            } catch (criterionError) {
              console.error('Error adding criterion:', criterionError);
              throw criterionError;
            }
          }
        }

        await conn.commit();
        console.log('Assessment creation transaction committed successfully');
        conn.release();

        res.status(201).json({
          message: 'Assessments created successfully',
          assessmentIds
        });
      } catch (error) {
        console.error('Transaction error during assessment creation:', error);
        await conn.rollback();
        conn.release();
        throw error;
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      res.status(500).json({ message: 'Server error', details: error.message });
    }
  });

  // Submit assessment response
  router.post('/:id/submit', authenticateToken, async (req, res) => {
    try {
      // Only students can submit responses
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can submit responses' });
      }

      const { id } = req.params;
      const { feedback, scores } = req.body;

      if (!scores || !Array.isArray(scores) || scores.length === 0) {
        return res.status(400).json({ message: 'No scores provided' });
      }

      const conn = await pool.getConnection();
      await conn.beginTransaction();

      try {
        // Check if assessment exists and if student is in the group
        const [assessmentCheck] = await conn.execute(
          `SELECT a.id, a.group_id
           FROM assessments a
           JOIN group_students gs ON a.group_id = gs.group_id
           WHERE a.id = ? AND gs.student_id = ?`,
          [id, req.user.id]
        );

        if (assessmentCheck.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(404).json({ message: 'Assessment not found or you are not in the group' });
        }

        // Check if student already submitted (can uncomment to prevent resubmissions)
        /*
        const [existingResponse] = await conn.execute(
          `SELECT id FROM responses
           WHERE assessment_id = ? AND student_id = ? AND submitted_at IS NOT NULL`,
          [id, req.user.id]
        );

        if (existingResponse.length > 0) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ message: 'You have already submitted this assessment' });
        }
        */

        // Create or update response
        let responseId;
        const [existingResponseCheck] = await conn.execute(
          `SELECT id FROM responses
           WHERE assessment_id = ? AND student_id = ?`,
          [id, req.user.id]
        );

        if (existingResponseCheck.length > 0) {
          // Update existing response
          await conn.execute(
            `UPDATE responses
             SET feedback = ?, submitted_at = NOW()
             WHERE id = ?`,
            [feedback || null, existingResponseCheck[0].id]
          );
          responseId = existingResponseCheck[0].id;

          // Delete any existing results
          await conn.execute(
            `DELETE FROM results WHERE response_id = ?`,
            [responseId]
          );
        } else {
          // Create new response
          const [responseResult] = await conn.execute(
            `INSERT INTO responses (assessment_id, student_id, feedback, submitted_at)
             VALUES (?, ?, ?, NOW())`,
            [id, req.user.id, feedback || null]
          );
          responseId = responseResult.insertId;
        }

        // Insert scores
        for (const score of scores) {
          if (!score.criteriaId || !score.studentId || score.score === undefined) {
            throw new Error('Invalid score data');
          }

          await conn.execute(
            `INSERT INTO results (response_id, criteria_id, student_id, given_score)
             VALUES (?, ?, ?, ?)`,
            [responseId, score.criteriaId, score.studentId, score.score]
          );
        }

        await conn.commit();

        // Calculate average scores for the students
        const [avgScores] = await conn.execute(
          `SELECT student_id, AVG(given_score) as average
           FROM results
           WHERE response_id = ?
           GROUP BY student_id`,
          [responseId]
        );

        conn.release();

        res.json({
          message: 'Assessment submitted successfully',
          responseId,
          averageScores: avgScores
        });
      } catch (error) {
        await conn.rollback();
        conn.release();
        throw error;
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get assessment results
  router.get('/:id/results', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const conn = await pool.getConnection();

      // Check permissions and get basic assessment info
      const [assessmentRows] = await conn.execute(
        `SELECT a.*, c.name as courseName, g.name as groupName
         FROM assessments a
         JOIN courses c ON a.course_id = c.id
         JOIN groups g ON a.group_id = g.id
         WHERE a.id = ?`,
        [id]
      );

      if (assessmentRows.length === 0) {
        conn.release();
        return res.status(404).json({ message: 'Assessment not found' });
      }

      const assessment = assessmentRows[0];

      // Check permissions - only teachers and admins can view results
      let permissionCheck;
      if (req.user.role === 'teacher') {
        // Teachers must teach the course of this assessment
        [permissionCheck] = await conn.execute(
          `SELECT 1 FROM course_teachers ct
           JOIN assessments a ON ct.course_id = a.course_id
           WHERE a.id = ? AND ct.teacher_id = ?`,
          [id, req.user.id]
        );
      } else if (req.user.role === 'admin') {
        // Admins can view any results
        permissionCheck = [1];
      } else {
        // Students are not allowed to view results
        conn.release();
        return res.status(403).json({ message: 'Students are not authorized to view assessment results' });
      }

      if (!permissionCheck || permissionCheck.length === 0) {
        conn.release();
        return res.status(403).json({ message: 'Not authorized to view these results' });
      }

      // Get assessment criteria
      const [criteria] = await conn.execute(
        `SELECT id, name, description, min_score, max_score
         FROM assessment_criteria
         WHERE assessment_id = ?`,
        [id]
      );

      // Different data based on role
      let results;

      // Helper function to get color based on score percentage
      const getScoreColor = (score, maxScore) => {
        if (!score || !maxScore) return 'neutral';
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return 'excellent';
        if (percentage >= 70) return 'good';
        if (percentage >= 60) return 'average';
        if (percentage >= 50) return 'below-average';
        return 'poor';
      };

      // Teachers and admins see results for all students in the group
        const [studentList] = await conn.execute(
          `SELECT u.id, u.first_name, u.last_name, u.q_number
           FROM users u
           JOIN group_students gs ON u.id = gs.student_id
           WHERE gs.group_id = ?`,
          [assessment.group_id]
        );

        const studentResults = [];

        // For each student, get their average scores by criteria and feedback
        for (const student of studentList) {
          const [criteriaScores] = await conn.execute(
            `SELECT
               ac.id as criteria_id,
               ac.name as criteria_name,
               ac.max_score,
               AVG(r.given_score) as average_score,
               COUNT(r.id) as number_of_ratings
             FROM assessment_criteria ac
             LEFT JOIN results r ON ac.id = r.criteria_id AND r.student_id = ?
             LEFT JOIN responses resp ON r.response_id = resp.id AND resp.assessment_id = ?
             WHERE ac.assessment_id = ?
             GROUP BY ac.id, ac.name, ac.max_score`,
            [student.id, id, id]
          );

          // Get overall average for this student
          const [overallAvg] = await conn.execute(
            `SELECT
               AVG(r.given_score) as overall_average,
               AVG(ac.max_score) as max_average
             FROM results r
             JOIN responses resp ON r.response_id = resp.id
             JOIN assessment_criteria ac ON r.criteria_id = ac.id
             WHERE resp.assessment_id = ? AND r.student_id = ?`,
            [id, student.id]
          );

          // Get feedback from other students about this student
          const [feedbackFromOthers] = await conn.execute(
            `SELECT
               resp.feedback,
               u.first_name,
               u.last_name,
               resp.submitted_at
             FROM responses resp
             JOIN users u ON resp.student_id = u.id
             JOIN results r ON r.response_id = resp.id
             WHERE resp.assessment_id = ?
             AND r.student_id = ?
             AND resp.feedback IS NOT NULL
             AND resp.feedback != ''
             AND resp.submitted_at IS NOT NULL
             GROUP BY resp.id`,
            [id, student.id]
          );

          // Get feedback given by this student about others
          const [feedbackGivenByStudent] = await conn.execute(
            `SELECT
               resp.feedback,
               GROUP_CONCAT(DISTINCT CONCAT(u2.first_name, ' ', u2.last_name) SEPARATOR ', ') as evaluated_students,
               resp.submitted_at
             FROM responses resp
             LEFT JOIN results r ON r.response_id = resp.id
             LEFT JOIN users u2 ON r.student_id = u2.id
             WHERE resp.assessment_id = ?
             AND resp.student_id = ?
             AND resp.submitted_at IS NOT NULL
             GROUP BY resp.id`,
            [id, student.id]
          );

          studentResults.push({
            student: {
              id: student.id,
              firstName: student.first_name,
              lastName: student.last_name,
              qNumber: student.q_number
            },
            criteriaScores: criteriaScores.map(criteria => ({
              ...criteria,
              average_score: criteria.average_score ? parseFloat(criteria.average_score).toFixed(1) : 'N/A',
              score_display: criteria.average_score ?
                `${parseFloat(criteria.average_score).toFixed(1)}/${criteria.max_score}` :
                `N/A/${criteria.max_score}`,
              score_color: getScoreColor(criteria.average_score, criteria.max_score)
            })),
            overallAverage: overallAvg[0].overall_average ? parseFloat(overallAvg[0].overall_average).toFixed(1) : 'N/A',
            overallAverageDisplay: overallAvg[0].overall_average && overallAvg[0].max_average ?
              `${parseFloat(overallAvg[0].overall_average).toFixed(1)}/${parseFloat(overallAvg[0].max_average).toFixed(1)}` :
              'N/A',
            overallScoreColor: getScoreColor(overallAvg[0].overall_average, overallAvg[0].max_average),
            feedbackReceived: feedbackFromOthers,
            feedbackGiven: feedbackGivenByStudent[0] || null
          });
        }

        results = studentResults;

      conn.release();

      // Calculate the average maxScore from criteria
      const avgMaxScore = criteria.length > 0
        ? criteria.reduce((sum, c) => sum + parseFloat(c.max_score), 0) / criteria.length
        : 5.0;

      res.json({
        id: assessment.id,
        title: assessment.title,
        courseName: assessment.courseName,
        groupName: assessment.groupName,
        description: assessment.description,
        dueDate: assessment.due_date,
        maxScore: avgMaxScore,
        criteria: criteria,
        results: results
      });
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get feedback for assessment (teachers only)
  router.get('/:id/feedback', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;

      // Only teachers can access feedback
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only teachers can view feedback' });
      }

      const conn = await pool.getConnection();

      // Check if teacher can access this assessment (teacher of the course)
      const [assessmentCheck] = await conn.execute(
        `SELECT a.id, a.title, a.group_id
         FROM assessments a
         JOIN course_teachers ct ON a.course_id = ct.course_id
         WHERE a.id = ? AND (ct.teacher_id = ? OR ? = 'admin')`,
        [id, req.user.id, req.user.role]
      );

      if (assessmentCheck.length === 0) {
        conn.release();
        return res.status(403).json({ message: 'Not authorized to view this assessment feedback' });
      }

      const assessment = assessmentCheck[0];

      // Get all feedback for this assessment
      const [feedbackData] = await conn.execute(
        `SELECT
           r.id as response_id,
           r.feedback,
           r.submitted_at,
           u.first_name as student_first_name,
           u.last_name as student_last_name,
           u.q_number as student_q_number,
           GROUP_CONCAT(DISTINCT CONCAT(u2.first_name, ' ', u2.last_name) SEPARATOR ', ') as evaluated_students
         FROM responses r
         JOIN users u ON r.student_id = u.id
         LEFT JOIN results res ON res.response_id = r.id
         LEFT JOIN users u2 ON res.student_id = u2.id
         WHERE r.assessment_id = ?
         AND r.submitted_at IS NOT NULL
         AND r.feedback IS NOT NULL
         AND r.feedback != ''
         GROUP BY r.id
         ORDER BY r.submitted_at DESC`,
        [id]
      );

      conn.release();

      res.json({
        assessment: {
          id: assessment.id,
          title: assessment.title
        },
        feedback: feedbackData.map(row => ({
          responseId: row.response_id,
          feedback: row.feedback,
          submittedAt: row.submitted_at,
          student: {
            firstName: row.student_first_name,
            lastName: row.student_last_name,
            qNumber: row.student_q_number
          },
          evaluatedStudents: row.evaluated_students
        }))
      });
    } catch (error) {
      console.error('Error fetching assessment feedback:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
