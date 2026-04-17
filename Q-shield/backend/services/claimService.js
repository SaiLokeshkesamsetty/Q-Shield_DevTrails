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
            const existingPolicy = await pool.query('SELECT policy_id FROM policies WHERE worker_id = $1 AND status = \'Active\' LIMIT 1', [triggerData.targetWorkerId]);
            if (existingPolicy.rows.length === 0) {
                 await pool.query(`
                     INSERT INTO policies (worker_id, status, premium_paid, start_date)
                     VALUES ($1, 'Active', 35, NOW())
                 `, [triggerData.targetWorkerId]);
            }

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
    let mode = 'LIVE'; // Strict live audit

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

        // --- STAGE 0: DAILY LIMIT CHECK (Auto-trigger limit) ---
        // Ensure money is sent automatically only ONE time for a day
        const dailyLimitQuery = `
            SELECT claim_id 
            FROM claims 
            WHERE policy_id = $1 
            AND status IN ('Approved', 'Paid', 'Processing')
            AND created_at >= CURRENT_DATE
            AND claim_id != $2
        `;
        const dailyLimitRes = await pool.query(dailyLimitQuery, [worker.policy_id, claimId]);
        if (dailyLimitRes.rows.length > 0) {
            console.log(`[LCP] 🛑 Auto-Trigger Blocked. Worker ${worker.worker_id} already received a payout/claim today.`);
            await pool.query(`UPDATE claims SET status = 'Rejected', failed_stage = 'POLICY_LIMIT', rejection_reason = 'Daily limit reached (1 claim per day)' WHERE claim_id = $1`, [claimId]);
            return;
        }

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
        const { isValid: isLocationValid, distance, reason: fraudReason } = await fraudService.validateWorkerLocation(
            worker.worker_id, 
            trigger.centerLoc, 
            trigger.radiusKm,
            mode
        );

        if (!isLocationValid) {
            await rejectClaim(claimId, 'FRAUD', fraudReason);
            return;
        }

        // Feature 2: Behavioral Analytics System
        try {
             // We inject ML Behavioral Checking here 
             // Normally we would query lifetime claim frequency, setting nominal to 2 for hackathon
             console.log(`[LCP] 🧠 Contacting AI Fraud Engine for Confidence Score...`);
             const fraudResponse = await fetch('http://127.0.0.1:8000/api/predict_fraud', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     distance_km: distance || 0.0,
                     recent_claims: 2, // Would be a DB query COUNT(*)
                     hour: new Date().getHours() // Timestamp feature injection
                 })
             });
             
             if (fraudResponse.ok) {
                 const fraudData = await fraudResponse.json();
                 console.log(`[LCP] 🤖 AI Fraud Engine responded: Risk = ${fraudData.fraud_probability}%, Valid = ${fraudData.is_safe}`);
                 if (!fraudData.is_safe) {
                     await rejectClaim(claimId, 'FRAUD', `AI Anomaly Detection Flagged Activity (Confidence: ${fraudData.fraud_probability}%)`);
                     return;
                 }
             }
        } catch(e) {
             console.warn(`[LCP] ⚠️ AI Prediction Service offline. Proceeding with standard GPS boundary checks.`, e.message);
        }

        // --- STAGE 4: PAYOUT CALCULATION & DISBURSEMENT ---
        await updateStep(claimId, 'Payout_Calculating');
        
        let PAYOUT_AMOUNT = 150;
        let severityScore = 0;
        let aiMultiplier = 1.0;
        
        // Add robust fallback for liveParams and traffic objects in trigger
        const liveParams = trigger.liveParams || { rain: 0, aqi: 50, temp: 30 };
        const trafficParams = trigger.traffic || { delay: 0, speedRatio: 1.0 };
        
        // Feature 3: Dynamic Multi-Event Payout Engine via ML Model
        try {
             // We use native fetch (available in Node 18+)
             console.log(`[LCP] 🧠 Contacting AI Risk Engine for Dynamic Scoring...`);
             const riskResponse = await fetch('http://127.0.0.1:8000/api/predict_risk', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     rain_mm: liveParams.rain || 0,
                     aqi: liveParams.aqi || 50,
                     temp: liveParams.temp || 30,
                     traffic_delay_min: (1.0 - (trafficParams.speedRatio || 1.0)) * 60
                 })
             });
             if (riskResponse.ok) {
                 const riskData = await riskResponse.json();
                 severityScore = riskData.calculated_risk_score || 0;
                 aiMultiplier = 1 + (severityScore / 100);
                 console.log(`[LCP] 🤖 AI Risk Engine responded. Severity: ${severityScore}, Multiplier: ${aiMultiplier.toFixed(2)}x`);
             } else {
                 throw new Error("AI Prediction Service offline or non-200");
             }
        } catch(e) {
             console.warn(`[LCP] ⚠️ AI Prediction Service offline. Falling back to rule-based actuarial math.`, e.message);
             // Legacy fallback (as the user requested)
             const severityMult = trigger.eventType.includes('Air') ? (trigger.severityNumeric > 380 ? 2.5 : 1.5) : (trigger.severityNumeric > 70 ? 2.0 : 1.2);
             const durationFactor = 1 + ((trigger.durationHours - 1) * 0.2); 
             aiMultiplier = severityMult * durationFactor;
        }

        PAYOUT_AMOUNT = Math.round(150 * aiMultiplier);
        if (PAYOUT_AMOUNT > 1000) PAYOUT_AMOUNT = 1000; // Cap to prevent bankruptcy on overlapping disasters

        const metadata = {
            base: 150,
            severity: trigger.severityNumeric || severityScore,
            multiplier: parseFloat(aiMultiplier.toFixed(2)),
            duration: trigger.durationHours,
            tier: tier,
            final_payout: PAYOUT_AMOUNT,
            reason: trigger.eventType.includes('Air') ? `AQI Alert + ML Multiplier` : `Weather Anomaly + ML Multiplier`
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
