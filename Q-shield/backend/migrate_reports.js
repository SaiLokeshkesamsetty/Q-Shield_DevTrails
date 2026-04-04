require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    console.log("🚀 Starting report migration...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log("Creating disruption_reports table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS disruption_reports (
                report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                worker_id UUID REFERENCES workers(worker_id),
                zone VARCHAR(255),
                reason TEXT,
                status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log("✅ Report migration successful!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Report migration failed:", err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
