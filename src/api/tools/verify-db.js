const mysql = require('mysql2/promise');

// Required tables that should exist in the database
const requiredTables = [
  'users',
  'courses',
  'course_teachers',
  'course_students',
  'groups',
  'group_students',
  'assessments',
  'assessment_criteria',
  'responses',
  'results',
];

// Create a database connection with database name from env
const verifyDatabase = async () => {
  console.log('Verifying database setup...');

  // Create connection
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    console.log('✅ Connected to database successfully');
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }

  // Check if all required tables exist
  try {
    const [rows] = await connection.query('SHOW TABLES');
    const existingTables = rows.map(row => Object.values(row)[0]);

    console.log('\nChecking required tables:');

    let allTablesExist = true;
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table} (missing)`);
        allTablesExist = false;
      }
    }

    if (allTablesExist) {
      console.log('\n✅ All required tables exist!');
    } else {
      console.log('\n❌ Some required tables are missing!');
      console.log('Please run the schema.sql file to create all required tables.');
    }

    // Check for sample data
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0].count > 0) {
      console.log('\n✅ Sample data is available');
    } else {
      console.log('\n⚠️ No sample data found (this might be intentional)');
    }
  } catch (err) {
    console.error('Error checking tables:', err.message);
  }

  // Close connection
  await connection.end();
  console.log('\nVerification complete!');
};

// Run the verification
verifyDatabase();
