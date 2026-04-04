const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
    console.log("🚀 Starting LCP v5 Migration...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add mode to workers
        console.log("Updating workers table...");
        await client.query(`
            ALTER TABLE workers 
            ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'LIVE'
        `);

        // 2. Upgrade claims table
        console.log("Updating claims table...");
        await client.query(`
            ALTER TABLE claims 
            ADD COLUMN IF NOT EXISTS processing_step VARCHAR(100),
            ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'LIVE',
            ADD COLUMN IF NOT EXISTS failed_stage VARCHAR(50),
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
            ADD COLUMN IF NOT EXISTS calculation_metadata JSONB,
            ADD COLUMN IF NOT EXISTS duration_hours INT DEFAULT 1
        `);

        // 3. Add Idempotency Constraint
        console.log("Adding idempotency constraint...");
        try {
            await client.query(`
                ALTER TABLE claims 
                ADD CONSTRAINT unique_policy_trigger UNIQUE (policy_id, trigger_id)
            `);
        } catch (e) {
            console.log("Note: Idempotency constraint might already exist or conflicting data exists. Skipping.");
        }

        await client.query('COMMIT');
        console.log("✅ Migration Successful.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Migration Failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
