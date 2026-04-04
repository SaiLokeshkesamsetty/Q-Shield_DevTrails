const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const claims = await pool.query(`
            SELECT 
                c.claim_id, 
                c.payout_amount, 
                c.status as claim_status, 
                c.processing_step, 
                c.created_at as claim_date,
                t.event_type as trigger_type
            FROM claims c 
            JOIN policies p ON c.policy_id = p.policy_id 
            LEFT JOIN triggers t ON c.trigger_id = t.trigger_id
            WHERE p.worker_id = $1 
            ORDER BY c.created_at DESC
        `, [req.user.worker_id]);
        
        const payouts = await pool.query(`SELECT * FROM payouts WHERE worker_id = $1 ORDER BY paid_at DESC`, [req.user.worker_id]);
        
        res.json({ claims: claims.rows, payouts: payouts.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
