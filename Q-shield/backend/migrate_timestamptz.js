const pool = require('./db');

async function migrate() {
    console.log("🚀 [Migration] Converting tables to TIMESTAMPTZ for timezone synchronization...");
    
    const queries = [
        "ALTER TABLE workers ALTER COLUMN last_active_timestamp SET DATA TYPE TIMESTAMPTZ",
        "ALTER TABLE policies ALTER COLUMN start_date SET DATA TYPE TIMESTAMPTZ",
        "ALTER TABLE policies ALTER COLUMN end_date SET DATA TYPE TIMESTAMPTZ",
        "ALTER TABLE triggers ALTER COLUMN trigger_time SET DATA TYPE TIMESTAMPTZ",
        "ALTER TABLE triggers ALTER COLUMN recorded_timestamp SET DATA TYPE TIMESTAMPTZ",
        "ALTER TABLE claims ALTER COLUMN created_at SET DATA TYPE TIMESTAMPTZ",
        "ALTER TABLE payouts ALTER COLUMN paid_at SET DATA TYPE TIMESTAMPTZ",
        "ALTER TABLE disruption_reports ALTER COLUMN created_at SET DATA TYPE TIMESTAMPTZ"
    ];

    try {
        for (const sql of queries) {
            console.log(`Running: ${sql}`);
            await pool.query(sql);
        }
        console.log("✅ [Migration] Database successfully upgraded to TIMESTAMPTZ!");
        process.exit(0);
    } catch (err) {
        console.error("❌ [Migration] Error during TIMESTAMPTZ conversion:", err.message);
        process.exit(1);
    }
}

migrate();
