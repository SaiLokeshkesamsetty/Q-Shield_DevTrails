const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  try {
    console.log('🚀 [Migration] Adding Gig Verification columns...');
    
    await pool.query(`
      ALTER TABLE workers 
      ADD COLUMN IF NOT EXISTS is_gig_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verified_gig_platform VARCHAR(100);
    `);
    
    console.log('✅ [Migration] Successfully added verification columns.');
  } catch (err) {
    console.error('❌ [Migration] Failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
