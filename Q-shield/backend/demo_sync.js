const pool = require('./db');

async function syncDB() {
    try {
        console.log('1. TRUNCATING old data...');
        await pool.query('TRUNCATE TABLE payouts CASCADE');
        await pool.query('TRUNCATE TABLE claims CASCADE');
        await pool.query('TRUNCATE TABLE policies CASCADE');
        await pool.query('TRUNCATE TABLE disruption_reports CASCADE');
        await pool.query('TRUNCATE TABLE triggers CASCADE'); // clean triggers too

        console.log('2. Syncing 1 policy & 1 claim per worker...');
        const workers = await pool.query('SELECT * FROM workers');
        
        for (const w of workers.rows) {
            console.log(`Syncing Worker: ${w.name}`);
            
            // 1 active policy
            const pol = await pool.query(
                `INSERT INTO policies (worker_id, premium_paid, status) 
                 VALUES ($1, $2, $3) RETURNING policy_id`, 
                [w.worker_id, 50, 'Active']
            );
            
            // 1 paid claim
            const claim = await pool.query(
                `INSERT INTO claims (policy_id, payout_amount, status, processing_step) 
                 VALUES ($1, $2, $3, $4) RETURNING claim_id`, 
                [pol.rows[0].policy_id, 250, 'Paid', 'Completed']
            );
            
            // 1 layout
            await pool.query(
                `INSERT INTO payouts (worker_id, claim_id, amount, payment_status) 
                 VALUES ($1, $2, $3, $4)`, 
                [w.worker_id, claim.rows[0].claim_id, 250, 'Success']
            );
        }

        console.log('Sync Complete! Math is now perfect for the demo.');
    } catch(e) {
        console.error('Fatal Sync Error:', e);
    } finally {
        process.exit();
    }
}

syncDB();
