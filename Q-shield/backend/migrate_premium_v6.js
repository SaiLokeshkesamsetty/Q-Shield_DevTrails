require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
    try {
        console.log("Adding worker_premium_overrides table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS worker_premium_overrides (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                worker_id UUID REFERENCES workers(worker_id) ON DELETE CASCADE,
                custom_premium DECIMAL(10,2) NOT NULL,
                ai_suggested_premium DECIMAL(10,2),
                reason TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMPTZ NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            );
        `);
        console.log("Table 'worker_premium_overrides' created.");
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS active_overrides_idx 
            ON worker_premium_overrides(worker_id) 
            WHERE is_active = TRUE;
        `);
        console.log("Index 'active_overrides_idx' created.");

        console.log("Migration complete.");
    } catch(e) {
        console.error("Migration failed", e);
    } finally {
        pool.end();
    }
}

migrate();
