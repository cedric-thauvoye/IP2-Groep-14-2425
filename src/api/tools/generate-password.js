const bcrypt = require('bcryptjs');

// The password you want to hash
const password = process.argv[2] || 'password123';

// Generate salt and hash
const generateHash = async (plainPassword) => {
  try {
    // Generate a salt with 10 rounds (same as in your auth.js)
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    console.log('\nPassword Hash Generator');
    console.log('=====================');
    console.log(`Original Password: ${plainPassword}`);
    console.log(`Generated Hash: ${hashedPassword}`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
};

// Run the function
generateHash(password);
