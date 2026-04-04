/**
 * check_db.js
 * Quick script to verify latest claims and payouts in Supabase.
 */
const pool = require('./db');

async function check() {
    try {
        console.log("🧐 [Audit] Checking latest 5 claims and payouts...");
        
        const claims = await pool.query(`
            SELECT c.claim_id, c.status, c.processing_step, c.payout_amount, t.zone, c.created_at
            FROM claims c 
            LEFT JOIN triggers t ON c.trigger_id = t.trigger_id 
            ORDER BY c.created_at DESC LIMIT 5
        `);
        
        console.table(claims.rows);

        const payouts = await pool.query(`
            SELECT payout_id, worker_id, amount, payment_status, paid_at 
            FROM payouts 
            ORDER BY paid_at DESC LIMIT 5
        `);
        
        console.table(payouts.rows);

        process.exit(0);
    } catch (err) {
        console.error("❌ [Audit] Database Query Failed:", err.message);
        process.exit(1);
    }
}

check();
