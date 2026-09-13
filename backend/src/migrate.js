const { pool } = require('./config/db');

async function migrate() {
  try {
    console.log('Running migration: Adding is_shared to files table');
    await pool.query('ALTER TABLE files ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;');
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
