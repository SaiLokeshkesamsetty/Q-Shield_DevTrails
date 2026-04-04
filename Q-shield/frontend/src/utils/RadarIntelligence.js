/**
 * RadarIntelligence.js
 * Pure functional utility layer for risk calculations and telemetry processing.
 */

export const RISK_THRESHOLDS = {
    CRITICAL: 70,
    MEDIUM: 40,
    LOW: 0
};

export const calculateRiskScore = (telemetry) => {
    if (!telemetry) return 0;
    
    // Weighted formula for Parametric Disruption Detection
    const rainScore = (parseFloat(telemetry.rainfall) || 0) * 2.5; 
    const aqiScore = (telemetry.aqi || 50) / 4;
    const tempFactor = Math.abs((telemetry.temperature || 25) - 25) * 1.5;

    const total = rainScore + aqiScore + tempFactor;
    return Math.min(Math.round(total), 100);
};

export const getRiskLevel = (score) => {
    if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
};

export const evaluateEligibility = (worker, intelligence) => {
    if (!worker || !intelligence) return false;
    return intelligence.level === 'CRITICAL' && worker.is_verified;
};
