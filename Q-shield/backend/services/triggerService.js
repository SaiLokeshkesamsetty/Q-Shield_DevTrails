/**
 * triggerService.js
 * Advanced Disruption Monitoring Engine.
 * Thresholds: AQI > 300, Rain > 50mm, Temp > 42C
 */
const EventEmitter = require('events');
const pool = require('../db');

class TriggerEngine extends EventEmitter {
    constructor() {
        super();
        this.simulationActive = false;
        this.currentMockTrigger = null;
        this.WEATHER_API_KEY = process.env.WEATHER_API_KEY;
        this.TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
    }

    async fetchTrafficData(lat, lng) {
        if (!this.TOMTOM_API_KEY || !lat || !lng) return { speedRatio: 1.0, label: 'OK' };
        try {
            const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${this.TOMTOM_API_KEY}&point=${lat},${lng}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.flowSegmentData) {
                const current = data.flowSegmentData.currentSpeed;
                const freeFlow = data.flowSegmentData.freeFlowSpeed;
                const ratio = current / freeFlow;
                return { 
                    speedRatio: ratio, 
                    label: ratio < 0.3 ? 'CRITICAL_JAM' : (ratio < 0.6 ? 'DELAYED' : 'OK'),
                    current, freeFlow
                };
            }
            return { speedRatio: 1.0, label: 'OK' };
        } catch(e) {
            console.error("[TriggerService] TomTom Traffic Fetch Failed:", e.message);
            return { speedRatio: 1.0, label: 'ERROR' };
        }
    }

    async fetchLiveData(zone) {
        if (!this.WEATHER_API_KEY) {
            return { rain: 0, aqi: 50, condition: "Clear", temp: 25 };
        }
        try {
            // Priority 1: Try the exact suburb/zone (e.g. Arundelpet)
            // Priority 2: Use the full string if suburb fails
            // Priority 3: Fallback to Hyderabad if all else fails
            const cleanZone = (zone || 'Hyderabad').trim();
            const queries = [cleanZone.split(',')[0], cleanZone];
            
            let data = null;
            for (const q of queries) {
                const url = `http://api.weatherapi.com/v1/current.json?key=${this.WEATHER_API_KEY}&q=${encodeURIComponent(q)}&aqi=yes`;
                const response = await fetch(url);
                data = await response.json();
                if (!data.error) break;
            }

            if (!data || data.error) {
                // Silently fallback to Hyderabad if the user's specific zone is unknown to WeatherAPI
                const fallbackUrl = `http://api.weatherapi.com/v1/current.json?key=${this.WEATHER_API_KEY}&q=Hyderabad&aqi=yes`;
                const fbRes = await fetch(fallbackUrl);
                data = await fbRes.json();
            }

            const live = {
                rain: data.current.precip_mm || 0,
                aqi: data.current.air_quality.pm2_5 || 50,
                condition: data.current.condition.text,
                temp: data.current.temp_c,
                lat: data.location.lat,
                lng: data.location.lon
            };

            return live;
        } catch (err) {
            console.error("❌ [TriggerService] API Fetch Failed:", err.message);
            return null;
        }
    }

    async startMonitoring() {
        console.log("🚦 [TriggerService] Engine started. Monitoring thresholds (AQI > 300, Rain > 50mm)...");
        
        setInterval(async () => {
            // Dynamically check zones with active workers to ensure the platform scales
            const { rows } = await pool.query('SELECT DISTINCT home_zone FROM workers');
            const zones = rows.map(r => r.home_zone); 

            for (const zoneName of zones) {
                let live = await this.fetchLiveData(zoneName);
                if (!live) continue;

                // 📡 REAL-TIME MULTI-SENSOR SCAN
                const traffic = await this.fetchTrafficData(live.lat, live.lng);

                let eventType = null;
                let severity = '';
                let durationHours = 1;
                let severityNumeric = 0;

                // Advanced Automated Thresholds
                if (live.aqi > 300) {
                    eventType = 'Air Quality Disruption';
                    severityNumeric = live.aqi;
                    severity = `AQI Index ${live.aqi.toFixed(1)} (Hazardous)`;
                } else if (live.rain > 50.0) {
                    eventType = 'Extreme Weather (Rain)';
                    severityNumeric = live.rain;
                    severity = `Precipitation ${live.rain} mm/hr - ${live.condition}`;
                } else if (live.temp > 42.0) {
                    eventType = 'Extreme Heat';
                    severityNumeric = live.temp;
                    severity = `Temperature ${live.temp}°C (Critical)`;
                } else if (traffic && traffic.speedRatio < 0.4) {
                    eventType = 'TRAFFIC_FLOW_DISRUPTION'; // Map to a known payout type
                    severityNumeric = Math.round(traffic.speedRatio * 100);
                    severity = `Traffic Congestion: ${severityNumeric}% Speed Efficiency`;
                }

                if (eventType) {
                    await this.fireTrigger(eventType, severity, zoneName, { lat: live.lat, lng: live.lng }, 5.0, severityNumeric, durationHours);
                }
            }
        }, 30000); // Check every 30 seconds
    }

    async fireTrigger(eventType, severity, zoneName, centerLoc, radiusKm = 5.0, severityNumeric = 0, durationHours = 1, isSimulation = false, targetWorkerId = null) {
        console.log(`\n🚨 [TriggerService] TRIGGER FIRED: ${eventType} in ${zoneName}! (Severity: ${severityNumeric}, Simulation: ${isSimulation}, Target: ${targetWorkerId || 'Global'})`);
        try {
            const query = `
                INSERT INTO triggers (event_type, severity_value, zone, zone_center, radius_km, severity_numeric, trigger_time)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING trigger_id
            `;
            const { rows } = await pool.query(query, [
                eventType, 
                severity, 
                zoneName, 
                JSON.stringify(centerLoc), 
                radiusKm, 
                severityNumeric,
                new Date().toISOString()
            ]);
            const triggerId = rows[0].trigger_id;

            // Emit event for event-driven architecture
            this.emit('TRIGGER_FIRED', {
                triggerId,
                eventType,
                zoneName,
                centerLoc,
                radiusKm,
                severityNumeric,
                durationHours,
                isSimulation,
                targetWorkerId,
                severityString: severity
            });

        } catch (err) {
            console.error('[TriggerService] Database error logging trigger', err);
        }
    }

    async getLiveRiskForZone(zone) {
        const live = await this.fetchLiveData(zone);
        if (!live || !live.condition) return { risk: 'LOW', reason: 'Sensors Offline (Safe Mode)' };

        let risk = 'LOW';
        let reason = live.condition || 'Clear Skies';

        if (live.aqi > 300 || live.rain > 50 || live.temp > 42) {
            risk = 'HIGH';
        } else if (live.aqi > 150 || live.rain > 15 || live.temp > 38) {
            risk = 'MEDIUM';
        }

        return {
            risk,
            reason: `${reason} — Temp: ${live.temp}°C, Rain: ${live.rain}mm, AQI: ${live.aqi.toFixed(0)}`,
            raw: live
        };
    }

    async mockTriggerFire(type, zone = 'Hyderabad', lat = null, lng = null, targetWorkerId = null) {
        const tMap = {
            'RAIN': 'Extreme Weather (Rain)',
            'AQI': 'Air Quality Disruption',
            'TRAFFIC': 'TRAFFIC_JAM' // legacy
        };
        let eventType = tMap[type] || 'Extreme Weather (Rain)';
        console.log(`[Demo Control] Simulation request: ${eventType} for ${zone} at (${lat}, ${lng}), TargetWorker: ${targetWorkerId}`);
        
        let mode = 'LIVE';
        if (targetWorkerId) {
            try {
                const { rows } = await pool.query('SELECT mode FROM workers WHERE worker_id = $1', [targetWorkerId]);
                mode = rows[0]?.mode || 'LIVE';
            } catch(e) {
                console.warn(`[TriggerService] Could not fetch mode for worker ${targetWorkerId} (likely demo ID). Defaulting to LIVE.`);
            }
        }

        let severityNumeric = 0;
        let durationHours = 2;
        let severity = '';
        let triggerCenterLat = lat || 17.3850;
        let triggerCenterLng = lng || 78.4867;

        if (mode === 'DEMO') {
            console.log(`[Demo Control] 🧪 Demo Mode detected. Overriding with guaranteed success parameters.`);
            severityNumeric = type === 'AQI' ? 380 : 75;
            durationHours = type === 'AQI' ? 3 : 2;
            severity = type === 'AQI' ? 'AQI Index 380 (Hazardous)' : 'Precipitation 75 mm/hr';
        } else {
            // 🔎 Parametric Rigor: Perform actual audit instead of forcing high values
            console.log(`[Demo Control] 🔎 LIVE Audit: Pulling real telemetry for ${zone}.`);
            const liveParams = await this.fetchLiveData(zone);
            const traffic = await this.fetchTrafficData(liveParams?.lat || triggerCenterLat, liveParams?.lng || triggerCenterLng);

            let metThreshold = null;

            // Strict audit check against Enterprise Thresholds (standardized across platforms)
            if (liveParams && liveParams.rain >= 50) {
                 metThreshold = { type: 'Extreme Weather (Rain)', num: liveParams.rain, text: `Real-World Precipitation ${liveParams.rain} mm/hr - ${liveParams.condition}` };
            } else if (liveParams && liveParams.aqi >= 300) {
                 metThreshold = { type: 'Air Quality Disruption', num: liveParams.aqi, text: `Real-World AQI Index ${liveParams.aqi.toFixed(1)}` };
            } else if (liveParams && liveParams.temp >= 42) {
                 metThreshold = { type: 'Extreme Heat', num: liveParams.temp, text: `Real-World Temperature ${liveParams.temp}°C` };
            } else if (traffic && traffic.speedRatio < 0.4) {
                 metThreshold = { type: 'TRAFFIC_FLOW_DISRUPTION', num: Math.round(traffic.speedRatio * 100), text: `Real-World Traffic Congestion: ${Math.round(traffic.speedRatio * 100)}% Speed Efficiency` };
            }

            if (metThreshold) {
                console.log(`✅ [Demo Control] Threshold met in real-time! Proceeding with Payout.`);
                eventType = metThreshold.type;
                severityNumeric = metThreshold.num;
                severity = metThreshold.text;
                if (liveParams?.lat) { triggerCenterLat = liveParams.lat; triggerCenterLng = liveParams.lng; }
            } else {
                console.log(`🚩 [Demo Control] Thresholds not met. System will REJECT the simulated claim.`);
                eventType = 'MULTI_AUDIT_FAIL'; 
                severityNumeric = 0;
                severity = `Parametric Audit Failed. Current conditions: Rain:${liveParams?.rain||0}mm, AQI:${Math.round(liveParams?.aqi||0)}, TrfRatio:${traffic.speedRatio.toFixed(2)}`;
            }
        }

        // 🚀 INSTANT TRIGGER: Drop the payload directly into the pipeline
        await this.fireTrigger(eventType, severity, zone, { lat: triggerCenterLat, lng: triggerCenterLng }, 5.0, severityNumeric, durationHours, true, targetWorkerId);
    }
}

const engine = new TriggerEngine();
module.exports = engine;
