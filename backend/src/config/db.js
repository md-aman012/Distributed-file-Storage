const { Pool } = require('pg');
require('dotenv').config();

// Create a new connection pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If connecting to a cloud provider like Neon or Supabase, SSL is usually required.
  // We use process.env.NODE_ENV to check if we should enforce SSL.
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
