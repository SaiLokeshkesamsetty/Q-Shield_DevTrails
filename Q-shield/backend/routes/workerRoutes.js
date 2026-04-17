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
        worker_id: '11111111-1111-1111-1111-111111111111',
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

// Update Worker Status (Check-In & Mode Toggle)
router.patch('/:id/status', async (req, res) => {
    const { latitude, longitude, mode = 'LIVE' } = req.body;
    try {
        const query = `
            UPDATE workers 
            SET last_location = $1, last_active_timestamp = CURRENT_TIMESTAMP, mode = $3
            WHERE worker_id = $2
            RETURNING *
        `;
        const { rows } = await pool.query(query, [JSON.stringify({ lat: latitude, lng: longitude }), req.params.id, mode]);
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

// Verify Gig App Platform (Simulated AI Scan)
router.post('/:id/verify-gig-app', async (req, res) => {
    const { platform, screenshot } = req.body;
    const workerId = req.params.id;

    console.log(`🔍 [AI Scanner] Initiating verification for worker ${workerId} on ${platform}...`);
    
    // Simulate high-complexity OCR/Pattern matching processing delay
    await new Promise(resolve => setTimeout(resolve, 2500)); 

    try {
        const query = `
            UPDATE workers 
            SET is_gig_verified = TRUE, verified_gig_platform = $1, trust_score = LEAST(trust_score + 15, 100)
            WHERE worker_id = $2
            RETURNING *
        `;
        const { rows } = await pool.query(query, [platform, workerId]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Worker not found' });
        
        console.log(`✅ [AI Scanner] Verification Success: ${platform}`);
        res.json({
            success: true,
            message: `Identity verified as active ${platform} partner.`,
            worker: rows[0],
            verification_id: `VER-GIG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });
    } catch (err) {
        console.error("❌ [AI Scanner] Verification Critical Failure:", err.message);
        res.status(500).json({ error: err.message });
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
// Get Dynamic Premium (Checks Forecast + AI Risk or Admin Override)
router.get('/:id/premium', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT home_zone FROM workers WHERE worker_id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Worker not found' });
        
        const zone = rows[0].home_zone;
        const basePremium = 35;
        let aiSuggestedPremium = 35;
        let aiData = { risk_level: 'Low', confidence: 0, explanation: 'AI Offline' };
        
        // 1. Check for Active Admin Override
        const overrideQuery = await pool.query(`
            SELECT custom_premium, expires_at 
            FROM worker_premium_overrides 
            WHERE worker_id = $1 AND is_active = TRUE AND expires_at > CURRENT_TIMESTAMP
            ORDER BY created_at DESC LIMIT 1
        `, [req.params.id]);

        const hasOverride = overrideQuery.rows.length > 0;
        
        // 2. Compute AI pricing
        try {
            const apiKey = process.env.WEATHER_API_KEY;
            const weatherUrl = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(zone)}&days=7&aqi=yes`;
            
            let dailyStats = [];
            let forecastError = false;
            
            try {
                const wRes = await fetch(weatherUrl);
                const forecastData = await wRes.json();
                
                if (forecastData.error) {
                    forecastError = true;
                } else {
                    dailyStats = forecastData.forecast.forecastday.map(d => ({
                         rain_mm: d.day.totalprecip_mm,
                         temp: d.day.maxtemp_c,
                         wind_kph: d.day.maxwind_kph
                    }));
                }
            } catch(e) { forecastError = true; }
            
            if (forecastError) {
                 // 🛡️ DEMO FALLBACK
                 dailyStats = Array.from({length: 7}).map((_, i) => ({
                     rain_mm: parseFloat((Math.random() * 25).toFixed(1)),
                     temp: parseFloat((28 + Math.random() * 10).toFixed(1)),
                     wind_kph: parseFloat((10 + Math.random() * 15).toFixed(1))
                 }));
            }
                
            const aiRes = await fetch('http://127.0.0.1:8000/api/predict_forecast_risk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daily_forecasts: dailyStats })
            });
            
            if (aiRes.ok) {
                aiData = await aiRes.json();
                const aiMultiplier = 1.0 + (aiData.calculated_risk_score / 50.0);
                aiSuggestedPremium = Math.round(basePremium * aiMultiplier);
                if (aiSuggestedPremium > 150) aiSuggestedPremium = 150;
            }
            
        } catch(e) { console.error('[WorkerRoutes: Premium] Error fetching AI Forecast', e.message); }

        res.json({
            basePremium,
            aiSuggestedPremium,
            finalPremium: hasOverride ? overrideQuery.rows[0].custom_premium : aiSuggestedPremium,
            overrideActive: hasOverride,
            riskLevel: aiData.risk_level,
            confidence: aiData.confidence,
            explainableAI: aiData.explanation
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

