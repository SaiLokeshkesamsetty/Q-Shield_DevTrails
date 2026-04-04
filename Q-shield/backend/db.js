const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Create a new pool using the connection string attached in the .env.
const connectionString = process.env.DATABASE_URL;
console.log(`[DB] Connecting to: ${connectionString ? connectionString.split('@')[1] : 'NO URL SET'}`);
const pool = new Pool({ connectionString });

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('PostgreSQL database connected perfectly!');
    release();
  }
});

module.exports = pool;
