/**
 * claimService.js
 * Event-driven Claims Pipeline.
 * Pipeline: Trigger -> Eligibility -> Fraud -> Payout -> Done
 */
const pool = require('../db');
const triggerEngine = require('./triggerService');
const underwritingService = require('./underwritingService');
const fraudService = require('./fraudService');
const payoutService = require('./payoutService');

// Listen for global triggers
triggerEngine.on('TRIGGER_FIRED', async (triggerData) => {
    try {
        console.log(`[ClaimService] 📡 Incoming Trigger: ${triggerData.eventType} in ${triggerData.zoneName} (Simulation: ${triggerData.isSimulation})`);
        
        // 1. Fetch affected workers
        let affectedWorkers = [];
        
        // --- DIRECT INJECTION PATH (Demo Simulation) ---
        if (triggerData.targetWorkerId) {
            console.log(`[ClaimService] 🎯 TARGETED INJECTION: Aiming trigger ${triggerData.triggerId} directly at Worker ${triggerData.targetWorkerId}`);
            
            // 🚀 SURGE ACTIVATION (Demo Resilience)
            // We force or create the policy record to ensure the simulation ALWAYS works for the demo.
            await pool.query(`
                INSERT INTO policies (worker_id, status, premium_paid, coverage_amount, start_date)
                VALUES ($1, 'Active', 35, 500, NOW())
                ON CONFLICT (worker_id) DO UPDATE SET status = 'Active'
            `, [triggerData.targetWorkerId]);

            const directQuery = `
                SELECT w.worker_id, w.upi_id, w.home_zone, w.mode, p.policy_id 
                FROM workers w
                JOIN policies p ON w.worker_id = p.worker_id
                WHERE w.worker_id = $1 AND p.status = 'Active'
            `;
            const { rows } = await pool.query(directQuery, [triggerData.targetWorkerId]);
            affectedWorkers = rows;
        } else {
            // --- STANDARD GEOGRAPHIC PATH ---
            console.log(`[ClaimService] 📡 GEOGRAPHIC MATCHING: Scanning for workers in fuzzy zone "${triggerData.zoneName}"`);
            const query = `
                SELECT w.worker_id, w.upi_id, w.home_zone, w.mode, p.policy_id 
                FROM workers w
                JOIN policies p ON w.worker_id = p.worker_id
                WHERE p.status = 'Active' 
                AND ($1 ILIKE '%' || w.home_zone || '%' OR w.home_zone ILIKE '%' || $1 || '%')
            `;
            const { rows } = await pool.query(query, [triggerData.zoneName]);
            affectedWorkers = rows;
        }

        if (affectedWorkers.length === 0) {
            console.log(`[ClaimService] ⚠️ No active policies found for this trigger. Pipeline terminated.`);
            return;
        }

        console.log(`[ClaimService] Found ${affectedWorkers.length} potentially affected workers. Spawning individual processing...`);

        // 2. Individual Pipeline Execution
        for (let worker of affectedWorkers) {
            processIndividualClaim(worker, triggerData);
        }

    } catch (err) {
        console.error('[ClaimService] Global pipeline error:', err);
    }
});

/**
 * Process the zero-touch pipeline for a single worker.
 */
async function processIndividualClaim(worker, trigger) {
    let claimId = null;
    let mode = worker.mode || 'LIVE'; // From DB

    try {
        // --- PRE-PIPELINE: Create Idempotent Claim Record ---
        const insertClaim = `
            INSERT INTO claims (policy_id, trigger_id, status, processing_step, mode)
            VALUES ($1, $2, 'Processing', 'Triggered', $3)
            ON CONFLICT (policy_id, trigger_id) DO NOTHING
            RETURNING claim_id
        `;
        const claimRes = await pool.query(insertClaim, [worker.policy_id, trigger.triggerId, mode]);
        
        if (claimRes.rows.length === 0) {
            console.log(`[LCP] 🛡️ Idempotency Triggered. Claim already exists for Worker ${worker.worker_id} / Trigger ${trigger.triggerId}`);
            return;
        }
        claimId = claimRes.rows[0].claim_id;

        // --- STAGE 1: THRESHOLD VALIDATION ---
        console.log(`[LCP] 📡 STAGE 1: Threshold Verification (Mode: ${mode})`);
        const { isValid: isThresholdValid, reason: thresholdReason } = underwritingService.validateWeatherThreshold(
            trigger.eventType,
            trigger.severityNumeric,
            trigger.severityString,
            mode,
            trigger.liveParams,
            trigger.traffic
        );

        if (!isThresholdValid) {
            await rejectClaim(claimId, 'THRESHOLD', thresholdReason);
            return;
        }

        // --- STAGE 2: ELIGIBILITY AUDIT ---
        await updateStep(claimId, 'Eligibility_Checking');
        console.log(`[LCP] 🛡️ STAGE 2: Eligibility Audit`);
        const { isEligible, tier, reason: eligReason } = await underwritingService.validateEligibility(
            worker.worker_id, 
            trigger.zoneName,
            mode
        );

        if (!isEligible) {
            await rejectClaim(claimId, 'ELIGIBILITY', eligReason);
            return;
        }

        // --- STAGE 3: FRAUD / PROXIMITY CHECK ---
        await updateStep(claimId, 'Fraud_Verifying');
        console.log(`[LCP] 🕵️ STAGE 3: Fraud & Proximity Audit`);
        const { isValid: isLocationValid, reason: fraudReason } = await fraudService.validateWorkerLocation(
            worker.worker_id, 
            trigger.centerLoc, 
            trigger.radiusKm,
            mode
        );

        if (!isLocationValid) {
            await rejectClaim(claimId, 'FRAUD', fraudReason);
            return;
        }

        // --- STAGE 4: PAYOUT CALCULATION & DISBURSEMENT ---
        await updateStep(claimId, 'Payout_Calculating');
        
        const baseAmount = 150;
        const severityMult = trigger.eventType.includes('Air') ? (trigger.severityNumeric > 380 ? 2.5 : 1.5) : (trigger.severityNumeric > 70 ? 2.0 : 1.2);
        const durationFactor = 1 + ((trigger.durationHours - 1) * 0.2); 
        
        let PAYOUT_AMOUNT = Math.round(baseAmount * severityMult * durationFactor);
        if (PAYOUT_AMOUNT > 500) PAYOUT_AMOUNT = 500;

        const metadata = {
            base: baseAmount,
            severity: trigger.severityNumeric,
            multiplier: severityMult,
            duration: trigger.durationHours,
            tier: tier,
            final_payout: PAYOUT_AMOUNT,
            reason: trigger.eventType.includes('Air') ? `AQI ${trigger.severityNumeric} detected` : `Rainfall ${trigger.severityNumeric}mm detected`
        };

        // Finalize Claim & Payout
        await pool.query(
            `UPDATE claims SET status = 'Approved', payout_amount = $1, calculation_metadata = $2 WHERE claim_id = $3`,
            [PAYOUT_AMOUNT, JSON.stringify(metadata), claimId]
        );

        await updateStep(claimId, 'Transferring');
        console.log(`[LCP] 💸 Disbursing ₹${PAYOUT_AMOUNT} to Worker ${worker.worker_id}`);
        await payoutService.initiateSettlement(claimId, worker.worker_id, PAYOUT_AMOUNT);
        console.log(`[LCP] ✨ Pipeline Complete for Worker ${worker.worker_id}`);

    } catch (err) {
        console.error(`[LCP] Critical Pipeline Failure for worker ${worker.worker_id}:`, err);
        if (claimId) {
             await pool.query(`UPDATE claims SET status = 'Error', rejection_reason = 'System timeout or internal error' WHERE claim_id = $1`, [claimId]);
        }
    } finally {
        // 🧪 Demo Persistence:
        // Worker mode is now persistent and will only change if the user manually updates their profile.
    }
}

async function updateStep(claimId, step) {
    await pool.query(`UPDATE claims SET processing_step = $1 WHERE claim_id = $2`, [step, claimId]);
}

async function rejectClaim(claimId, stage, reason) {
    console.log(`🚩 [LCP] Claim Rejected at ${stage}: ${reason}`);
    await pool.query(
        `UPDATE claims SET status = 'Rejected', failed_stage = $1, rejection_reason = $2, processing_step = $3 WHERE claim_id = $4`,
        [stage, reason, stage + '_Rejected', claimId]
    );
}

module.exports = {
   // Exposed for manual testing
   processIndividualClaim
};
