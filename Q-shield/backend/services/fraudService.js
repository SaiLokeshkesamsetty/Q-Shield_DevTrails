/**
 * fraudService.js
 * Location-based fraud detection to ensure the worker was in the affected zone during the event.
 */
const pool = require('../db');

/**
 * Validates if the worker's last recorded location is within the triggering radius.
 * @param {string} workerId 
 * @param {object} triggerCenter { lat, lng }
 * @param {string} mode 
 * @returns {Promise<{isValid: boolean, distance?: number, reason?: string}>}
 */
async function validateWorkerLocation(workerId, triggerCenter, radiusKm = 5.0, mode = 'LIVE') {
    try {
        const query = `
            SELECT latitude, longitude, last_location, last_active_timestamp 
            FROM workers 
            WHERE worker_id = $1
        `;
        const { rows } = await pool.query(query, [workerId]);

        if (rows.length === 0) return { isValid: false, reason: 'Worker not found' };

        const worker = rows[0];
        
        // 🚀 DEMO MODE: Bypass fraud checks for demo runs
        if (mode === 'DEMO') {
            console.log(`[Fraud] 🧪 DEMO Mode Active. Auto-Approving location integrity for worker ${workerId}.`);
            return { isValid: true, distance: 0 };
        }

        // --- 🥇 Location Logic (Direct Registration Prioritized) ---
        // We use the Latitude/Longitude selected during map registration for 100% precision
        // or Fallback to live last_location if available
        const lat = worker.latitude || worker.last_location?.lat;
        const lng = worker.longitude || worker.last_location?.lng;

        if (lat === undefined || lng === undefined) {
            return { isValid: false, reason: 'Worker location data missing' };
        }

        console.log(`[FraudService] Auditing worker ${workerId} at (${lat}, ${lng}) against trigger at (${triggerCenter.lat}, ${triggerCenter.lng})`);

        // 1. Distance Calculation (Haversine Formula) --- Using Registration Precision
        const dist = calculateDistance(lat, lng, triggerCenter.lat, triggerCenter.lng);

        if (dist > radiusKm) {
            return { isValid: false, distance: dist, reason: `Worker was too far away (${dist.toFixed(2)} km) from the disruption center. (Demo Tip: Click 'GO ONLINE' to sync your location)` };
        }

        // 2. Time Freshness Check
        const now = new Date();
        const lastActive = new Date(worker.last_active_timestamp);
        const diffMinutes = Math.abs(now.getTime() - lastActive.getTime()) / (1000 * 60);

        if (diffMinutes > 1440) { // 24 Hours
            return { isValid: false, reason: 'Worker location data is stale (> 24h age)' };
        }

        return { isValid: true, distance: dist };

    } catch (err) {
        console.error('[FraudService] Error validating location:', err);
        return { isValid: false, reason: 'System error' };
    }
}

/**
 * Calculate distance between two lat/lng points in km.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

module.exports = {
    validateWorkerLocation
};
