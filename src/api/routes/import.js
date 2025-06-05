const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');
const crypto = require('crypto');

module.exports = (pool, bcrypt) => {
  const router = express.Router();

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (allowedMimeTypes.includes(file.mimetype) ||
          file.originalname.match(/\.(csv|xlsx)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV and XLSX files are allowed'), false);
      }
    }
  });

  // Generate a secure random password
  const generateSecurePassword = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const length = 32; // 32 character random password
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  };

  // Middleware to verify JWT token
  const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    try {
      const user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
  };

  // Middleware to check if user is teacher or admin
  const requireTeacherOrAdmin = (req, res, next) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers and admins can import data' });
    }
    next();
  };

  // Parse CSV data from buffer
  const parseCSVFromBuffer = (buffer) => {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  };

  // Parse XLSX data from buffer
  const parseXLSXFromBuffer = (buffer) => {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];

      console.log('XLSX: Processing sheet:', sheetName);

      // Method 1: Try direct JSON conversion (this should work better)
      let results = XLSX.utils.sheet_to_json(worksheet);

      console.log('XLSX: Direct conversion result count:', results.length);
      if (results.length > 0) {
        console.log('XLSX: Direct conversion first object:', results[0]);
        console.log('XLSX: Direct conversion object keys:', Object.keys(results[0]));
      }

      // If that gives empty results, try manual parsing
      if (results.length === 0) {
        console.log('XLSX: Trying manual parsing method');
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          return [];
        }

        // First row contains headers
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);

        console.log('XLSX Headers found:', headers);
        console.log('XLSX First data row:', dataRows[0]);

        // Convert to object format similar to CSV parser
        results = dataRows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] ? String(row[index]).trim() : '';
          });
          return obj;
        });
      }

      // Now normalize the column names to match our expected format
      const normalizedResults = results.map(row => {
        const normalizedRow = {};

        // Find and map the columns regardless of exact naming
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase().trim();

          // Email mapping
          if (lowerKey.includes('email') || lowerKey.includes('e-mail') || lowerKey.includes('mail')) {
            normalizedRow['Email'] = row[key];
          }
          // First name mapping
          else if (lowerKey.includes('first') && lowerKey.includes('name') ||
                   lowerKey === 'firstname' || lowerKey === 'first_name' ||
                   lowerKey === 'voornaam' || lowerKey === 'prenom') {
            normalizedRow['First Name'] = row[key];
          }
          // Last name mapping
          else if (lowerKey.includes('last') && lowerKey.includes('name') ||
                   lowerKey === 'lastname' || lowerKey === 'last_name' ||
                   lowerKey === 'surname' || lowerKey === 'achternaam' ||
                   lowerKey === 'nom' || lowerKey === 'family_name') {
            normalizedRow['Last Name'] = row[key];
          }
          // Q Number mapping
          else if (lowerKey.includes('q') && (lowerKey.includes('number') || lowerKey.includes('num')) ||
                   lowerKey === 'qnumber' || lowerKey === 'q_number' ||
                   lowerKey === 'student_id' || lowerKey === 'studentid' ||
                   lowerKey === 'user_id' || lowerKey === 'userid' || lowerKey === 'user id') {
            normalizedRow['Q Number'] = row[key];
          }
          // Keep original key as backup
          else {
            normalizedRow[key] = row[key];
          }
        });

        return normalizedRow;
      });

      console.log('XLSX: Final normalized result count:', normalizedResults.length);
      if (normalizedResults.length > 0) {
        console.log('XLSX: First normalized object:', normalizedResults[0]);
        console.log('XLSX: Normalized object keys:', Object.keys(normalizedResults[0]));
      }

      return normalizedResults;
    } catch (error) {
      console.error('XLSX parsing error:', error);
      throw new Error('Failed to parse XLSX file: ' + error.message);
    }
  };

  // Determine file type and parse accordingly
  const parseFileData = async (file) => {
    const isXLSX = file.originalname.match(/\.xlsx$/i) ||
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (isXLSX) {
      return parseXLSXFromBuffer(file.buffer);
    } else {
      return await parseCSVFromBuffer(file.buffer);
    }
  };

  // Validate student data
  const validateStudentData = (students) => {
    const errors = [];
    const emailSet = new Set();
    const qNumberSet = new Set();

    students.forEach((student, index) => {
      const rowNum = index + 1;

      // Check required fields
      if (!student.Email || !student.Email.trim()) {
        errors.push(`Row ${rowNum}: Email is required`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.Email.trim())) {
        errors.push(`Row ${rowNum}: Invalid email format`);
      } else if (emailSet.has(student.Email.trim().toLowerCase())) {
        errors.push(`Row ${rowNum}: Duplicate email ${student.Email}`);
      } else {
        emailSet.add(student.Email.trim().toLowerCase());
      }

      if (!student['First Name'] || !student['First Name'].trim()) {
        errors.push(`Row ${rowNum}: First Name is required`);
      }

      if (!student['Last Name'] || !student['Last Name'].trim()) {
        errors.push(`Row ${rowNum}: Last Name is required`);
      }

      if (!student['Q Number'] || !student['Q Number'].trim()) {
        errors.push(`Row ${rowNum}: Q Number is required`);
      } else if (!/^q\d+$/i.test(student['Q Number'].trim())) {
        errors.push(`Row ${rowNum}: Q Number must start with 'q' followed by numbers`);
      } else if (qNumberSet.has(student['Q Number'].trim().toLowerCase())) {
        errors.push(`Row ${rowNum}: Duplicate Q Number ${student['Q Number']}`);
      } else {
        qNumberSet.add(student['Q Number'].trim().toLowerCase());
      }
    });

    return errors;
  };

  // Preview students import
  router.post('/students/preview', authenticateToken, requireTeacherOrAdmin, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Parse file (CSV or XLSX)
      const students = await parseFileData(req.file);

      console.log('Parsed students count:', students.length);
      if (students.length > 0) {
        console.log('First student object:', students[0]);
        console.log('Student object keys:', Object.keys(students[0]));
        console.log('Sample student data:');
        console.log('  Email:', students[0].Email);
        console.log('  First Name:', students[0]['First Name']);
        console.log('  Last Name:', students[0]['Last Name']);
        console.log('  Q Number:', students[0]['Q Number']);
      }

      if (students.length === 0) {
        return res.status(400).json({ message: 'File is empty or invalid' });
      }

      // Validate data
      const validationErrors = validateStudentData(students);

      // Check for existing emails and Q numbers in database
      const conn = await pool.getConnection();
      const emails = students.map(s => s.Email?.trim().toLowerCase()).filter(Boolean);
      const qNumbers = students.map(s => s['Q Number']?.trim().toLowerCase()).filter(Boolean);

      let existingEmails = [];
      let existingQNumbers = [];

      // Only query if there are emails to check
      if (emails.length > 0) {
        const [emailResults] = await conn.execute(
          `SELECT email FROM users WHERE LOWER(email) IN (${emails.map(() => '?').join(',')})`,
          emails
        );
        existingEmails = emailResults;
      }

      // Only query if there are Q numbers to check
      if (qNumbers.length > 0) {
        const [qNumberResults] = await conn.execute(
          `SELECT q_number FROM users WHERE LOWER(q_number) IN (${qNumbers.map(() => '?').join(',')})`,
          qNumbers
        );
        existingQNumbers = qNumberResults;
      }

      conn.release();

      // Add existing data errors
      const existingEmailSet = new Set(existingEmails.map(row => row.email.toLowerCase()));
      const existingQNumberSet = new Set(existingQNumbers.map(row => row.q_number.toLowerCase()));

      students.forEach((student, index) => {
        if (student.Email && existingEmailSet.has(student.Email.trim().toLowerCase())) {
          validationErrors.push(`Row ${index + 1}: Email ${student.Email} already exists in database`);
        }
        if (student['Q Number'] && existingQNumberSet.has(student['Q Number'].trim().toLowerCase())) {
          validationErrors.push(`Row ${index + 1}: Q Number ${student['Q Number']} already exists in database`);
        }
      });

      // Prepare preview data
      const previewData = students.map((student, index) => ({
        row: index + 1,
        email: student.Email?.trim() || '',
        firstName: student['First Name']?.trim() || '',
        lastName: student['Last Name']?.trim() || '',
        qNumber: student['Q Number']?.trim() || '',
        isValid: !validationErrors.some(error => error.includes(`Row ${index + 1}`))
      }));

      res.json({
        preview: previewData,
        totalRows: students.length,
        validRows: previewData.filter(row => row.isValid).length,
        errors: validationErrors,
        isValid: validationErrors.length === 0
      });

    } catch (error) {
      console.error('Error previewing student import:', error);
      res.status(500).json({ message: 'Error processing file: ' + error.message });
    }
  });

  // Import students (bulk)
  router.post('/students', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
      const { students } = req.body;

      if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: 'No student data provided' });
      }

      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        const insertedStudents = [];
        const errors = [];

        for (let i = 0; i < students.length; i++) {
          const student = students[i];

          try {
            // Generate a secure random password for the student
            // Students will use Microsoft authentication, so this password is just for database requirements
            const randomPassword = generateSecurePassword();
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const [result] = await conn.execute(
              `INSERT INTO users (email, first_name, last_name, q_number, role, password)
               VALUES (?, ?, ?, ?, 'student', ?)`,
              [
                student.email.trim(),
                student.firstName.trim(),
                student.lastName.trim(),
                student.qNumber.trim(),
                hashedPassword // Securely hashed random password
              ]
            );

            insertedStudents.push({
              id: result.insertId,
              email: student.email.trim(),
              firstName: student.firstName.trim(),
              lastName: student.lastName.trim(),
              qNumber: student.qNumber.trim()
            });

          } catch (insertError) {
            console.error('Error inserting student:', insertError);
            errors.push(`Failed to insert student ${student.email}: ${insertError.message}`);
          }
        }

        if (errors.length > 0 && insertedStudents.length === 0) {
          await conn.rollback();
          return res.status(400).json({
            message: 'Failed to import any students',
            errors
          });
        }

        await conn.commit();

        res.json({
          message: `Successfully imported ${insertedStudents.length} students`,
          imported: insertedStudents,
          errors: errors.length > 0 ? errors : undefined,
          totalImported: insertedStudents.length,
          totalErrors: errors.length
        });

      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

    } catch (error) {
      console.error('Error importing students:', error);
      res.status(500).json({ message: 'Server error during import: ' + error.message });
    }
  });

  // Download student template
  router.get('/template/students', authenticateToken, requireTeacherOrAdmin, (req, res) => {
    const csvContent = 'Email,First Name,Last Name,Q Number\n' +
                      'alice@example.com,Alice,Johnson,q1703022\n' +
                      'bob@example.com,Bob,Smith,q1703023\n' +
                      'charlie@example.com,Charlie,Brown,q1703024';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.csv"');
    res.send(csvContent);
  });

  return router;
};
