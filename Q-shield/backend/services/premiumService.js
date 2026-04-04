/**
 * premiumService.js
 * Advanced Actuarial Pricing Engine.
 * Formula: premium = baseRate × triggerProbability × avgIncomeLoss × riskMultiplier × activityMultiplier
 */

const CITY_RISK_POOLS = {
    'Delhi': { riskMultiplier: 1.5, avgIncomeLoss: 400 },
    'Mumbai': { riskMultiplier: 1.2, avgIncomeLoss: 350 },
    'Hyderabad': { riskMultiplier: 1.0, avgIncomeLoss: 300 },
    'Bangalore': { riskMultiplier: 1.1, avgIncomeLoss: 320 },
    'Guntur': { riskMultiplier: 0.9, avgIncomeLoss: 280 },
    'Arundelpet': { riskMultiplier: 0.9, avgIncomeLoss: 280 }
};

const TIER_MULTIPLIERS = {
    'HIGH': 1.2,   // More active, higher potential payout, slightly higher premium
    'MEDIUM': 1.0,
    'LOW': 0.8
};

/**
 * Calculate dynamic weekly premium for a worker.
 * @param {string} city 
 * @param {string} tier 
 * @param {number} trustScore 
 * @returns {number}
 */
function calculateDynamicPremium(city, tier = 'MEDIUM', trustScore = 100) {
    const baseRateValue = 35; // Base weekly INR
    
    const pool = CITY_RISK_POOLS[city] || CITY_RISK_POOLS['Hyderabad'];
    const tierMultiplier = TIER_MULTIPLIERS[tier] || 1.0;
    
    // Risk Score: Higher trust = lower premium
    const riskAdjustment = (100 - (trustScore || 100)) / 100; // 0 to 1

    // Formula Calculation: base * riskFactor * poolMultiplier * tierMultiplier
    let finalPremium = baseRateValue * (1 + riskAdjustment) * pool.riskMultiplier * tierMultiplier;

    // Floor and Ceiling for affordability (Enterprise Standard)
    if (finalPremium < 20) finalPremium = 20;
    if (finalPremium > 50) finalPremium = 50;

    return Math.floor(finalPremium);
}

module.exports = {
    calculateDynamicPremium
};
