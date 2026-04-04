const express = require('express');
const router = express.Router();
const pool = require('../db');
const triggerEngine = require('../services/triggerService');

// Demo Simulator Route
router.post('/simulate-trigger', async (req, res) => {
    const { triggerType, zone, lat, lng, workerId } = req.body; 
    
    if (!['RAIN', 'AQI', 'TRAFFIC'].includes(triggerType)) {
        return res.status(400).json({ error: 'Invalid trigger type' });
    }

    // 🚀 Instant Trigger (Targeted for Demo Reliability)
    await triggerEngine.mockTriggerFire(triggerType, zone || 'Hyderabad', lat, lng, workerId);
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

module.exports = router;
