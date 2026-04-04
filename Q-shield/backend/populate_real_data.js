const pool = require('./db');
const { randomUUID: uuidv4 } = require('crypto');

async function seed() {
    console.log('🌱 Starting Real Data Seeding (Hackathon Demo Mode)...');
    try {
        // 1. Cleanup old data to avoid noise
        await pool.query('DELETE FROM payouts');
        await pool.query('DELETE FROM claims');
        await pool.query('DELETE FROM triggers');
        await pool.query('DELETE FROM policies');
        await pool.query('DELETE FROM workers WHERE email NOT LIKE \'%@gmail.com\''); // Keep some realistic ones if they exist

        const workers = [
            { name: 'Rahul Sharma', zone: 'Arundelpet, Guntur', phone: '9848012345', platform: 'Swiggy' },
            { name: 'Priya Patel', zone: 'Hyderabad, Telangana', phone: '9000012345', platform: 'Zomato' },
            { name: 'Amit Singh', zone: 'Delhi, India', phone: '8008012345', platform: 'Blinkit' },
            { name: 'Suresh Raina', zone: 'Mumbai, India', phone: '7007012345', platform: 'Zepto' },
            { name: 'Anjali Gupta', zone: 'Vijayawada, India', phone: '9900012345', platform: 'Uber' },
            { name: 'Vikram Seth', zone: 'Guntur, India', phone: '9849012345', platform: 'Ola' },
            { name: 'Neha Reddy', zone: 'Bangalore, India', phone: '9123456789', platform: 'Dunzo' },
            { name: 'Karthik Raja', zone: 'Chennai, India', phone: '9234567890', platform: 'Swiggy' },
            { name: 'Megha Rao', zone: 'Arundelpet, Andhra Pradesh', phone: '9345678901', platform: 'Blinkit' },
            { name: 'Rohan Deshmukh', zone: 'Pune, India', phone: '9456789012', platform: 'Zomato' }
        ];

        const insertedWorkerIds = [];
        for (const w of workers) {
            const email = `${w.name.toLowerCase().replace(' ', '.')}@gmail.com`;
            
            // Insert Worker
            const res = await pool.query(`
                INSERT INTO workers (name, email, platform, home_zone, tier, active_days_last_30, trust_score, mode)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'LIVE')
                ON CONFLICT (email) DO UPDATE SET 
                    home_zone = EXCLUDED.home_zone,
                    tier = EXCLUDED.tier,
                    active_days_last_30 = EXCLUDED.active_days_last_30,
                    trust_score = EXCLUDED.trust_score
                RETURNING worker_id
            `, [w.name, email, w.platform, w.zone, w.tier || 'LOW', w.activeDays || 0, w.trustScore || 100]);
            
            const workerId = res.rows[0].worker_id;
            insertedWorkerIds.push(workerId);

            // Insert Policy
            const policyId = uuidv4();
            await pool.query(`
                INSERT INTO policies (policy_id, worker_id, premium_paid, status, start_date, end_date)
                VALUES ($1, $2, 50, 'Active', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '20 days')
                ON CONFLICT DO NOTHING
            `, [policyId, workerId]);

            // --- SEED PAYOUTS (Historical) ---
            const count = Math.floor(Math.random() * 5) + 2;
            for (let i = 0; i < count; i++) {
                const triggerId = uuidv4();
                const claimId   = uuidv4();
                const hoursAgo = Math.floor(Math.random() * 24);
                
                await pool.query(`
                    INSERT INTO triggers (trigger_id, event_type, zone, trigger_time, recorded_timestamp)
                    VALUES ($1, 'RAIN', $2, CURRENT_TIMESTAMP - (INTERVAL '1 hour' * $3), CURRENT_TIMESTAMP - (INTERVAL '1 hour' * $3))
                `, [triggerId, w.zone, hoursAgo]);

                await pool.query(`
                    INSERT INTO claims (claim_id, policy_id, trigger_id, status, payout_amount, created_at, mode)
                    VALUES ($1, $2, $3, 'Paid', $4, CURRENT_TIMESTAMP - (INTERVAL '1 hour' * $5), 'LIVE')
                `, [claimId, policyId, triggerId, 250, hoursAgo]);
            }
        }

        // --- SEED REJECTIONS (For Engine Integrity Sync) ---
        console.log('🛡️  Seeding Engine Rejection Analysis data...');
        const rejectionReasons = [
            { stage: 'THRESHOLD', reason: 'Precipitation (0.4mm) below parametric trigger threshold (2.0mm)' },
            { stage: 'ELIGIBILITY', reason: 'Worker was not active in the affected zone during the event window' },
            { stage: 'FRAUD', reason: 'GPS Telemetry mismatch: Device spoofing detected via proximity audit' },
            { stage: 'THRESHOLD', reason: 'AQI (140) below severe disruption threshold (300)' }
        ];

        for (const rej of rejectionReasons) {
            const workerId = insertedWorkerIds[Math.floor(Math.random() * insertedWorkerIds.length)];
            const policyRes = await pool.query('SELECT policy_id FROM policies WHERE worker_id = $1 LIMIT 1', [workerId]);
            if (policyRes.rows.length > 0) {
                await pool.query(`
                    INSERT INTO claims (claim_id, policy_id, status, failed_stage, rejection_reason, payout_amount, mode)
                    VALUES ($1, $2, 'Rejected', $3, $4, 0, 'LIVE')
                `, [uuidv4(), policyRes.rows[0].policy_id, rej.stage, rej.reason]);
            }
        }

        console.log('✅ Real Data Seeding Complete. Dashboard fully synchronized with Worker Engine!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
}

seed();
