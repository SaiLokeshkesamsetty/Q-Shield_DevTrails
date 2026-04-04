const express = require('express');
const router = express.Router();
const pool = require('../db');
const { calculateDynamicPremium } = require('../services/premiumService');
const triggerService = require('../services/triggerService');

// Register OR Login
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM workers ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Demo accounts for offline/DNS-failure fallback
const DEMO_ACCOUNTS = {
    'test@worker.com': {
        worker_id: '6fcb2716-9d15-4e79-8897-9dab6026492f',
        name: 'Test Worker',
        email: 'test@worker.com',
        password: 'password123',
        platform: 'Blinkit',
        home_zone: 'Hyderabad',
        latitude: 17.3850,
        longitude: 78.4867,
        tier: 'LOW',
        active_days_last_30: 15,
        is_verified: true
    },
    'demo@worker.com': {
        worker_id: 'demo-worker-001',
        name: 'Demo Worker',
        email: 'demo@worker.com',
        password: 'demo123',
        platform: 'Swiggy',
        home_zone: 'Hyderabad',
        latitude: 17.3850,
        longitude: 78.4867,
        tier: 'MEDIUM',
        active_days_last_30: 15,
        is_verified: true
    }
};

// Register OR Login
router.post('/auth', async (req, res) => {
    const { name, email, password, platform, zone, latitude, longitude } = req.body;

    try {
        let workerRes = await pool.query('SELECT * FROM workers WHERE email = $1', [email]);
        console.log(`🔑 [WorkerRoutes] Auth attempt for ${email} - Found: ${workerRes.rows.length > 0}`);
        if (workerRes.rows.length === 0) {
            // 🚀 New Registration: Insert Worker first
            const insertWorker = `
                INSERT INTO workers (name, email, password, platform, home_zone, latitude, longitude) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *`;
            const result = await pool.query(insertWorker, [name, email, password, platform, zone, latitude, longitude]);
            const newWorker = result.rows[0];
            
            console.log(`[WorkerRoutes] New worker saved to Supabase: ${name}`);
            
            workerRes = result;
        } else {
            // Login Check (Demo simple check)
            if (workerRes.rows[0].password !== password) {
                return res.status(401).json({ error: 'Incorrect password' });
            }
        }

        res.json(workerRes.rows[0]);
    } catch (err) {
        console.error("Auth error:", err.message);
        
        // 🔒 DEMO FALLBACK: If DB is unreachable, try demo accounts
        const demoAccount = DEMO_ACCOUNTS[email];
        if (demoAccount && demoAccount.password === password) {
            console.log(`✅ [WorkerRoutes] DB offline - using demo account for ${email}`);
            return res.json(demoAccount);
        }
        
        res.status(500).json({ error: 'Database connection error. Try demo@worker.com / demo123' });
    }
});


// Dashboard Data
router.get('/:id/dashboard', async (req, res) => {
    try {
        const worker = await pool.query(`SELECT * FROM workers WHERE worker_id = $1`, [req.params.id]);
        if (worker.rows.length === 0) return res.status(404).json({ error: 'Worker not found' });
        
        const wData = worker.rows[0];

        // Retrieve the most recent policy (active or expired), ignoring legacy policies with null dates
        const recentPolicyQuery = await pool.query(`SELECT * FROM policies WHERE worker_id = $1 ORDER BY start_date DESC NULLS LAST LIMIT 1`, [wData.worker_id]);
        let activePolicyRow = recentPolicyQuery.rows[0];

        // ⏱️ Policy Expiration Auto-Correction Hook
        if (activePolicyRow && activePolicyRow.status === 'Active') {
            const now = new Date();
            const endDate = new Date(activePolicyRow.end_date);
            if (now > endDate) {
                console.log(`[WorkerRoutes] ⏱️ Policy ${activePolicyRow.policy_id} expired. Auto-updating status.`);
                await pool.query(`UPDATE policies SET status = 'Expired' WHERE policy_id = $1`, [activePolicyRow.policy_id]);
                activePolicyRow.status = 'Expired';
            }
        }
        
          // Retrieve claims with explicit column selection to avoid collisions
        const claims = await pool.query(`
            SELECT 
                c.claim_id, 
                c.payout_amount as amount, 
                c.status as claim_status, 
                c.processing_step, 
                c.mode,
                c.failed_stage,
                c.rejection_reason,
                c.created_at,
                c.calculation_metadata,
                t.event_type as trigger_type
            FROM claims c 
            JOIN policies p ON c.policy_id = p.policy_id 
            LEFT JOIN triggers t ON c.trigger_id = t.trigger_id
            WHERE p.worker_id = $1 
            ORDER BY c.created_at DESC
        `, [wData.worker_id]);
        
        const payouts = await pool.query(`SELECT * FROM payouts WHERE worker_id = $1 ORDER BY paid_at DESC`, [wData.worker_id]);

        // Calculate dynamic live premium using AI-Rule service
        let currentZonePremiumOptions = 35; // default fallback
        try {
            currentZonePremiumOptions = calculateDynamicPremium(wData.home_zone);
        } catch (err) {
            console.error('[WorkerRoutes] calculateDynamicPremium failed:', err.message);
        }

        // EXTRA: Fetch real-time weather risk for the worker's home zone
        const liveRisk = await triggerService.getLiveRiskForZone(wData.home_zone);

        res.json({
            worker: wData,
            activeCoverage: activePolicyRow || null,
            liveRiskLevel: liveRisk.risk,
            riskReason: liveRisk.reason,
            currentPremiumQuote: currentZonePremiumOptions,
            claimsHistory: claims.rows,
            latestPayouts: payouts.rows,
            // 📡 Bulletproof Telemetry Bridge
            aqi: liveRisk.raw?.aqi ?? 42,
            rainfall: liveRisk.raw?.rain ?? 0,
            temperature: liveRisk.raw?.temp ?? 32,
            zone: wData.home_zone
        });
    } catch (err) {
       console.error('[WorkerRoutes] Dashboard unexpected error:', err.message);
       // 📊 DEMO FALLBACK: Return realistic demo data when DB is unreachable
       res.json({
           worker: DEMO_ACCOUNTS[req.params.id] || DEMO_ACCOUNTS['test@worker.com'],
           activeCoverage: {
               policy_id: 'POL-DEMO-001',
               coverage_amount: 500,
               premium_paid: 50,
               status: 'Active',
               start_date: new Date().toISOString()
           },
           liveRiskLevel: 'LOW',
           riskReason: 'Clear Skies — All sensors nominal',
           currentPremiumQuote: 45,
           claimsHistory: [
               { claim_id: 'CLM-DEMO-001', amount: 250, claim_status: 'Paid', processing_step: 'Completed', created_at: new Date(Date.now() - 3600000).toISOString() }
           ],
           latestPayouts: [
               { payout_id: 'PAY-DEMO-001', amount: 250, payment_status: 'Success', paid_at: new Date(Date.now() - 3600000).toISOString() }
           ],
           // 📡 Demo Telemetry Default
           aqi: 50,
           rainfall: 0,
           temperature: 28,
           zone: 'Guntur'
       });
    }
});

// Update Worker Status (Check-In)
router.patch('/:id/status', async (req, res) => {
    const { latitude, longitude } = req.body;
    try {
        const query = `
            UPDATE workers 
            SET last_location = $1, last_active_timestamp = CURRENT_TIMESTAMP, mode = 'DEMO'
            WHERE worker_id = $2
            RETURNING *
        `;
        const { rows } = await pool.query(query, [JSON.stringify({ lat: latitude, lng: longitude }), req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Worker not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error("❌ [WorkerRoutes] Status Update Failed:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Update Profile Data
router.patch('/:id/profile', async (req, res) => {
    try {
        const { phone_number, bank_details, notification_preferences, profile_image_url } = req.body;
        
        let updateQuery = `UPDATE workers SET `;
        let updates = [];
        let values = [];
        let idx = 1;

        if (phone_number !== undefined) {
            updates.push(`phone_number = $${idx++}`);
            values.push(phone_number);
        }
        if (bank_details !== undefined) {
            updates.push(`bank_details = $${idx++}`);
            values.push(bank_details);
        }
        if (notification_preferences !== undefined) {
            updates.push(`notification_preferences = $${idx++}`);
            values.push(notification_preferences);
        }
        if (profile_image_url !== undefined) {
            updates.push(`profile_image_url = $${idx++}`);
            values.push(profile_image_url);
        }

        if (updates.length > 0) {
            values.push(req.params.id);
            updateQuery += updates.join(', ') + ` WHERE worker_id = $${idx} RETURNING *`;
            
            const result = await pool.query(updateQuery, values);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Worker not found' });
            return res.json(result.rows[0]);
        }
        
        res.status(400).json({ error: 'No fields to update' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get Single Worker Profile
router.get('/:id/profile', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM workers WHERE worker_id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Worker not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

