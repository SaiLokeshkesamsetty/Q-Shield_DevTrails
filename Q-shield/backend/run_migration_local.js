const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
    // The SQL file is in the brain directory, but we can read it from here.
    const sqlPath = 'c:\\Users\\kesam\\.gemini\\antigravity\\brain\\85acced1-05d0-47db-b807-12ab9e8bb8af\\migrate_cascade_delete.sql';
    
    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('🚀 [Migration] Connecting to Supabase...');
        await pool.query(sql);
        console.log('✅ [Migration] Successfully applied CASCADE DELETE to all constraints.');
    } catch (err) {
        console.error('❌ [Migration] Failed to execute migration:', err.message);
        console.log('\n💡 [Tip] If this is a DNS error, try running the SQL content directly in the Supabase Dashboard SQL Editor.');
    } finally {
        process.exit();
    }
}

runMigration();
