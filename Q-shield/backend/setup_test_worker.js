/**
 * setup_test_worker.js
 * Creates a test worker in Hyderabad and activates a policy.
 */
const pool = require('./db');

async function setup() {
    try {
        console.log("🛠️ [Setup] Creating Test Worker in Hyderabad...");
        
        // 1. Create Worker
        const wQuery = `
            INSERT INTO workers (name, email, password, home_zone, last_location, active_days_last_30, last_active_timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (email) DO UPDATE SET active_days_last_30 = EXCLUDED.active_days_last_30, home_zone = EXCLUDED.home_zone, last_active_timestamp = CURRENT_TIMESTAMP
            RETURNING worker_id
        `;
        const workerRes = await pool.query(wQuery, [
            'Test Pilot', 
            'pilot@qshield.ai', 
            'pass123', 
            'Hyderabad', 
            JSON.stringify({ lat: 17.3850, lng: 78.4867 }),
            25 // Meets Eligibility
        ]);
        const workerId = workerRes.rows[0].worker_id;
        console.log(`✅ Worker Created: ${workerId}`);

        // 2. Create Active Policy
        const pQuery = `
            INSERT INTO policies (worker_id, start_date, end_date, premium_paid, status)
            VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '7 days', 50.00, 'Active')
            RETURNING policy_id
        `;
        const policyRes = await pool.query(pQuery, [workerId]);
        console.log(`✅ Policy Activated: ${policyRes.rows[0].policy_id}`);

        process.exit(0);
    } catch (err) {
        console.error("❌ [Setup] Failed:", err.message);
        process.exit(1);
    }
}

setup();
