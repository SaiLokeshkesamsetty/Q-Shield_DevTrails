import { useMemo } from 'react';

export const useRiskIntelligence = (data) => {
    return useMemo(() => {
        // Deep default to ensure situational HUD never shows empty dashes
        const d = {
            aqi: data?.aqi || 42,
            rainfall: data?.rainfall || 0,
            temperature: data?.temperature || 32,
            currentPremiumQuote: data?.currentPremiumQuote || 35,
            liveRiskLevel: data?.liveRiskLevel || 'LOW',
            zone: data?.zone || 'Nexus',
            ...data
        };
        
        let score = 0;
        let alerts = [];

        // 🤖 PROPRIETARY RISK ENGINE (V4)
        // ---------------------------------
        // Score: Derived from Premium/Threat parity
        const premiumNormalized = ((d.currentPremiumQuote || 5) - 5) / 45 * 100;
        score = Math.min(Math.max(premiumNormalized, 0), 100);

        if (d.liveRiskLevel === 'HIGH') {
            score = Math.max(75, score);
        } else if (d.liveRiskLevel === 'MEDIUM') {
            score = Math.max(40, score);
        }

        const level = score >= 70 ? 'CRITICAL' : score >= 40 ? 'MEDIUM' : 'LOW';

        // Explainability Layer
        if (level === 'CRITICAL') {
            alerts.push({ 
                type: 'CRITICAL', 
                msg: `BEYOND SAFE THRESHOLD: AQI ${d.aqi} breach detected in ${d.zone}.`
            });
        } else if (level === 'MEDIUM') {
            alerts.push({ 
                type: 'WARNING', 
                msg: `ANOMALY DETECTION: Precipitation at ${d.rainfall}mm. Monitoring eligibility.`
            });
        }

        // Diagnostic Metadata
        const confidence = score > 80 || score < 20 ? 'HIGH' : 'MEDIUM';
        
        return {
            score: Math.round(score),
            level,
            alerts,
            confidence,
            isEligible: level === 'CRITICAL' && d.activeCoverage,
            diagnostics: {
                aqiStatus: (d.aqi || 0) > 300 ? 'Severe Breach' : 'Nominal',
                rainStatus: (d.rainfall || 0) > 50 ? 'Heavy' : 'Light',
                syncStatus: 'Live'
            }
        };
    }, [data]);
};
