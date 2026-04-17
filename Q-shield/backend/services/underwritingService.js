/**
 * underwritingService.js
 * Manages policy eligibility based on worker activity history and city-based risk pools.
 */
const pool = require('../db');

/**
 * Validates if the current weather disruption meets the parametric payout threshold.
 * @param {string} eventType 
 * @param {number} severity 
 * @param {string} severityString 
 * @param {string} mode 
 * @param {object} liveParams
 * @param {object} traffic
 * @returns {{isValid: boolean, reason?: string}}
 */
function validateWeatherThreshold(eventType, severity, severityString, mode = 'LIVE', liveParams = null, traffic = null) {


    // ⚡ ENTERPRISE THRESHOLDS
    const RAIN_THRESHOLD = 50.0; // 50mm
    const AQI_THRESHOLD = 300;   // 300 AQI

    const eventTypeUpper = (eventType || '').toUpperCase();

    if (eventTypeUpper === 'MULTI_AUDIT_FAIL') {
        let details = 'Clear';
        if (liveParams && traffic) {
            details = `Rain: ${liveParams.rain}mm, Air AQI: ${Math.round(liveParams.aqi)}, Temp: ${liveParams.temp}°C, Traffic Delay: ${100 - Math.round(traffic.speedRatio * 100)}%`;
        }
        return { isValid: false, reason: `Strict Audit: All metrics below payout limits. Measured [${details}].` };
    }

    if (eventTypeUpper.includes('RAIN')) {
        if (severity < RAIN_THRESHOLD) {
            return { isValid: false, reason: `Rainfall threshold (${severity}mm) does not meet the triggering limit of ${RAIN_THRESHOLD}mm.` };
        }
    } else if (eventTypeUpper.includes('AIR')) {
        if (severity < AQI_THRESHOLD) {
            return { isValid: false, reason: `AQI levels (${severity}) are below the hazardous trigger threshold of ${AQI_THRESHOLD}.` };
        }
    } else if (eventTypeUpper.includes('HEAT') || eventTypeUpper.includes('TEMP')) {
        if (severity < 42) {
             return { isValid: false, reason: `Temperature (${severity}°C) does not meet the triggering limit of 42°C.` };
        }
    } else if (eventTypeUpper.includes('TRAFFIC')) {
        if (severity > 40) { // severity is speed efficiency %
             return { isValid: false, reason: `Traffic Flow (${severity}% efficiency) is not yet critical enough for parametric payout.` };
        }
    }

    return { isValid: true };
}

/**
 * Validates if a worker is eligible for the automated payout.
 * @param {string} workerId 
 * @param {string} triggerZone 
 * @param {string} mode
 * @returns {Promise<{isEligible: boolean, tier: string, reason?: string}>}
 */
async function validateEligibility(workerId, triggerZone, mode = 'LIVE') {
    try {
        console.log(`[Underwriting] Validating worker ${workerId} (Mode: ${mode})`);
        

        const query = `
            SELECT worker_id, home_zone, active_days_last_30, tier 
            FROM workers 
            WHERE worker_id = $1
        `;
        const { rows } = await pool.query(query, [workerId]);

        if (rows.length === 0) return { isEligible: false, tier: 'NONE', reason: 'Worker not found' };

        const worker = rows[0];

        // 1. City Pool Check (Bidirectional Fuzzy + Case-Insensitive)
        const wZone = (worker.home_zone || '').toLowerCase();
        const tZone = (triggerZone || '').toLowerCase();

        // Match if one string contains the other (e.g. "Guntur" in "Arundelpet, Guntur")
        if (!tZone.includes(wZone) && !wZone.includes(tZone) && wZone !== tZone) {
             console.log(`[Underwriting] ⚠️ Zone Mismatch: Worker(${wZone}) vs Trigger(${tZone})`);
             return { isEligible: false, tier: worker.tier, reason: 'Worker is not assigned to this city risk pool' };
        }

        // 2. Strict Active Days Rule
        // Reduced to 0 for demo accounts to allow immediate payouts during hackathon
        if (worker.active_days_last_30 < 0) {
            return { isEligible: false, tier: worker.tier, reason: 'Must have at least 0 active delivery days in the last 30 days' };
        }

        // 3. Time-Based Shift Check (Enterprise Guardrail - Relaxed to 72h for Demo)
        const now = new Date();
        const lastActive = worker.last_active_timestamp ? new Date(worker.last_active_timestamp) : null;
        
        // If never active or > 72h, normally would reject. Reduced for demo stability.
        if (lastActive) {
            const diffHours = Math.abs(now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
            if (diffHours > 72) {
                return { isEligible: false, tier: worker.tier, reason: `Account inactive for too long. Click 'Go Online' to refresh Nexus Sync.` };
            }
        }

        return { isEligible: true, tier: worker.tier };

    } catch (err) {
        console.error('[UnderwritingService] Error validating eligibility:', err);
        return { isEligible: false, tier: 'ERROR', reason: 'System error' };
    }
}

/**
 * Re-calculates and updates worker tiers based on recent activity.
 */
async function updateWorkerTiers() {
    const query = `
        UPDATE workers 
        SET tier = CASE 
            WHEN active_days_last_30 >= 20 THEN 'HIGH'
            WHEN active_days_last_30 >= 10 THEN 'MEDIUM'
            ELSE 'LOW'
        END
    `;
    await pool.query(query);
}

module.exports = {
    validateWeatherThreshold,
    validateEligibility,
    updateWorkerTiers
};
