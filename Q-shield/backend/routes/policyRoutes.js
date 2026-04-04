const express = require('express');
const router = express.Router();
const pool = require('../db');

// Purchase/Activate Policy
router.post('/purchase', async (req, res) => {
    const { worker_id, premium_amount } = req.body;
    
    try {
        // --- High-Fidelity Mock Razorpay Delay ---
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mock_txn_id = `pay_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[Policies] Verifying Virtual Razorpay Transaction: ${mock_txn_id}`);

        // Simple mock of 7-day policy validity
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        // Deactivate old policies visually (Hackathon shortcut)
        await pool.query(`UPDATE policies SET status = 'Expired' WHERE worker_id = $1 AND status = 'Active'`, [worker_id]);

        const insert = `
            INSERT INTO policies (worker_id, start_date, end_date, premium_paid, status)
            VALUES ($1, $2, $3, $4, 'Active')
            RETURNING *
        `;

        const newPolicy = await pool.query(insert, [worker_id, startDate.toISOString(), endDate.toISOString(), premium_amount]);
        
        console.log(`[Policies] Worker ${worker_id} purchased policy for ₹${premium_amount}. DB Record ID: ${newPolicy.rows[0].policy_id}`);
        res.json({ ...newPolicy.rows[0], transaction_id: mock_txn_id });

    } catch (err) {
         res.status(500).json({ error: err.message });
    }
});

module.exports = router;
