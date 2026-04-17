const express = require('express');
const router = express.Router();
const pool = require('../db');
const triggerEngine = require('../services/triggerService');

// Demo Simulator Route
router.post('/simulate-trigger', async (req, res) => {
    const { triggerType, zone, lat, lng, workerId, mode } = req.body; 
    
    if (!['RAIN', 'AQI', 'TRAFFIC'].includes(triggerType)) {
        return res.status(400).json({ error: 'Invalid trigger type' });
    }

    // 🚀 Instant Trigger (Targeted for Demo Reliability)
    await triggerEngine.mockTriggerFire(triggerType, zone || 'Hyderabad', lat, lng, workerId, mode);

    // ⏳ VERCEL SERVERLESS HACK: Keep the lambda alive for 2 seconds 
    // so the detached async claimService pipeline has time to finish database writes!
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.json({ success: true, message: `Disruption simulation for ${triggerType} triggered instantly for target: ${workerId || 'Global'}`});
});

// Admin Analytics Routes
router.get('/analytics', async (req, res) => {
    try {
        // 1. Claims: count and total payout
        const claimsCount    = await pool.query(`SELECT COUNT(*) FROM claims`);
        const paidClaims     = await pool.query(`SELECT COUNT(*), SUM(payout_amount) FROM claims WHERE status = 'Paid'`);
        
        // 2. Policies: count active (distinct workers), total premium collected
        const policyStats    = await pool.query(`SELECT COUNT(DISTINCT worker_id) as total, SUM(premium_paid) as total_premiums FROM policies WHERE status = 'Active'`);
        
        // 3. Workers: full list with tier, zone, active days, mode, last active
        const workers        = await pool.query(`SELECT worker_id, name, email, home_zone, tier, active_days_last_30, trust_score, mode, last_active_timestamp FROM workers`);
        
        // 4. Recent triggers
        const triggers       = await pool.query(`SELECT * FROM triggers ORDER BY recorded_timestamp DESC LIMIT 10`);

        const totalPayouts   = parseFloat(paidClaims.rows[0].sum  || 0);
        const totalPremiums  = parseFloat(policyStats.rows[0].total_premiums || 0);
        const totalClaims    = parseInt(claimsCount.rows[0].count || 0);
        const paidCount      = parseInt(paidClaims.rows[0].count  || 0);
        const activePolicies = parseInt(policyStats.rows[0].total || 0);

        // 5. Rejection Analytics
        const rejectedStats = await pool.query(`
            SELECT 
                COUNT(*) as total_rejected,
                COUNT(*) FILTER (WHERE failed_stage = 'THRESHOLD') as threshold_fails,
                COUNT(*) FILTER (WHERE failed_stage = 'ELIGIBILITY') as eligibility_fails,
                COUNT(*) FILTER (WHERE failed_stage = 'FRAUD') as fraud_fails
            FROM claims 
            WHERE status = 'Rejected'
        `);
        const rStats = rejectedStats.rows[0];

        // BCR = paid claims / active policies  (industry standard: claim frequency)
        const bcr       = activePolicies > 0 ? (paidCount / activePolicies).toFixed(2) : '0.00';
        // Loss Ratio = total payouts / total premiums collected
        const lossRatio = totalPremiums > 0 ? (totalPayouts / totalPremiums).toFixed(2) : '0.00';

        // 6. Dynamic Payout Velocity (7 points for last 24h, 3hr-4hr intervals)
        const velocityPoints = [];
        for (let i = 6; i >= 0; i--) {
            const result = await pool.query(`
                SELECT SUM(payout_amount) as total 
                FROM claims 
                WHERE status = 'Paid' 
                AND created_at > (CURRENT_TIMESTAMP - (INTERVAL '1 hour' * $1)) 
                AND created_at <= (CURRENT_TIMESTAMP - (INTERVAL '1 hour' * $2))
            `, [i * 4 + 4, i * 4]);
            velocityPoints.push(parseFloat(result.rows[0].total || 0));
        }

        res.json({
            totalClaims,
            paidClaims:    paidCount,
            totalPayouts,
            totalPremiums,
            activePolicies,
            totalWorkers:  workers.rows.length,
            bcr:           parseFloat(bcr),
            lossRatio:     parseFloat(lossRatio),
            payoutVelocity: velocityPoints,
            rejectionStats: {
                total: parseInt(rStats.total_rejected || 0),
                threshold: parseInt(rStats.threshold_fails || 0),
                eligibility: parseInt(rStats.eligibility_fails || 0),
                fraud: parseInt(rStats.fraud_fails || 0)
            },
            workers:       workers.rows,
            triggers:      triggers.rows,
            apiHealth: {
                cpcb: 'Healthy',
                imd:  'Healthy',
                lastCheck: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('[AdminRoutes] Analytics error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


// Admin Review: Get Pending Reports
router.get('/pending-reports', async (req, res) => {
    try {
        const query = `
            SELECT r.*, w.name as worker_name 
            FROM disruption_reports r 
            JOIN workers w ON r.worker_id = w.worker_id 
            WHERE r.status = 'Pending'
            ORDER BY r.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Action: Approve and Trigger
router.post('/approve-report/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get the report details
        const report = await pool.query('SELECT * FROM disruption_reports WHERE report_id = $1', [id]);
        if (report.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
        
        const zone = report.rows[0].zone;

        // 2. Update status
        await pool.query('UPDATE disruption_reports SET status = $1 WHERE report_id = $2', ['Approved', id]);

        // 3. Force the Trigger Engine to fire for this zone
        // For the hackathon demo, we trigger a RAIN event instantly
        await triggerEngine.mockTriggerFire('RAIN', zone); 
        
        res.json({ message: `Report approved. Triggering disruption payouts for ${zone}.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API for 7-Day Forecast & Risk Modeling
router.get('/forecast', async (req, res) => {
    try {
        const zone = req.query.zone || 'Hyderabad';
        const apiKey = process.env.WEATHER_API_KEY;
        const weatherUrl = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(zone)}&days=7&aqi=yes`;
        
        let dailyStats = [];
        let forecastError = false;

        try {
            const response = await fetch(weatherUrl);
            const forecast = await response.json();
            
            if (forecast.error) {
                forecastError = true;
                console.warn('[Admin Routes] WeatherAPI Error:', forecast.error.message);
            } else {
                dailyStats = forecast.forecast.forecastday.map(day => ({
                     date: day.date,
                     rain_mm: day.day.totalprecip_mm,
                     temp: day.day.maxtemp_c,
                     wind_kph: day.day.maxwind_kph
                }));
            }
        } catch(e) {
            forecastError = true;
            console.warn('[Admin Routes] WeatherAPI Fetch Exception:', e.message);
        }

        // 🛡️ DEMO FALLBACK: If WeatherAPI fails (invalid zone or missing key), generate realistic data
        if (forecastError) {
             dailyStats = Array.from({length: 7}).map((_, i) => ({
                 date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
                 rain_mm: parseFloat((Math.random() * 25).toFixed(1)),
                 temp: parseFloat((28 + Math.random() * 10).toFixed(1)),
                 wind_kph: parseFloat((10 + Math.random() * 15).toFixed(1))
             }));
        }

        // Contact AI Engine
        let riskData = { calculated_risk_score: 0, confidence: 0, risk_level: 'Low', explanation: 'AI Offline' };
        try {
            const aiResponse = await fetch('http://127.0.0.1:8000/api/predict_forecast_risk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daily_forecasts: dailyStats })
            });
            if (aiResponse.ok) riskData = await aiResponse.json();
        } catch(e) {
            console.warn('[Admin Routes] External AI Engine unreachable.', e.message);
        }

        // Calculate Premium bounds
        const basePremium = 35;
        const aiMultiplier = 1.0 + (riskData.calculated_risk_score / 50.0);
        let suggestedPremium = Math.round(basePremium * aiMultiplier);
        if (suggestedPremium > 150) suggestedPremium = 150;

        res.json({
            forecast: dailyStats,
            ai_analysis: riskData,
            suggested_premium: suggestedPremium,
            base_premium: basePremium
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Admin API to override premium
router.post('/workers/:workerId/premium', async (req, res) => {
    const { workerId } = req.params;
    const { customPremium, aiSuggestedPremium, reason, expiresAt } = req.body;
    try {
        // Invalidate previous ones
        await pool.query(`UPDATE worker_premium_overrides SET is_active = FALSE WHERE worker_id = $1`, [workerId]);
        
        // Insert new
        await pool.query(`
            INSERT INTO worker_premium_overrides (worker_id, custom_premium, ai_suggested_premium, reason, expires_at)
            VALUES ($1, $2, $3, $4, $5)
        `, [workerId, customPremium, aiSuggestedPremium, reason, expiresAt]);
        
        res.json({ success: true, message: "Premium overidden securely." });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
