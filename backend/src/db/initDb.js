const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read the init.sql file
    const sqlFilePath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL queries
    await pool.query(sql);
    
    console.log('Database initialized successfully! Table "users" created.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Only run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
