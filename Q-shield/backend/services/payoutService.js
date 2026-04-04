/**
 * payoutService.js
 * Simulated Razorpay/Stripe asynchronous settlement flow.
 */
const pool = require('../db');

/**
 * Initiates an asynchronous payout simulation.
 * @param {string} claimId 
 * @param {string} workerId 
 * @param {number} amount 
 */
async function initiateSettlement(claimId, workerId, amount) {
    try {
        console.log(`💸 [PayoutService] Initiating settlement for Claim: ${claimId} (₹${amount})...`);

        // 1. Initial State: Processing
        await pool.query(`
            INSERT INTO payouts (claim_id, worker_id, amount, payment_status)
            VALUES ($1, $2, $3, 'Processing')
        `, [claimId, workerId, amount]);

        // 🚀 DEMO OVERRIDE: 100% Guaranteed Success Rate
        const payoutSuccess = true;

        if (payoutSuccess) {
            await pool.query(`
                UPDATE payouts 
                SET payment_status = 'Success', paid_at = CURRENT_TIMESTAMP
                WHERE claim_id = $1
            `, [claimId]);

            await pool.query(`
                UPDATE claims 
                SET status = 'Paid', processing_step = 'Completed'
                WHERE claim_id = $1
            `, [claimId]);

            console.log(`✅ [PayoutService] Settlement SUCCESS for Claim: ${claimId}`);
        } else {
            await pool.query(`
                UPDATE payouts 
                SET payment_status = 'Failed'
                WHERE claim_id = $1
            `, [claimId]);

            await pool.query(`
                UPDATE claims 
                SET status = 'Failed', processing_step = 'Settlement_Failed'
                WHERE claim_id = $1
            `, [claimId]);

            console.log(`❌ [PayoutService] Settlement FAILED for Claim: ${claimId}`);
        }
    } catch (err) {
        console.error('[PayoutService] Error during settlement:', err);
    }
}

module.exports = {
    initiateSettlement
};
