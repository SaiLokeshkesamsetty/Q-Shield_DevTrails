/**
 * simulate_trigger.js
 * CLI tool to manually fire parametric triggers for testing the automated pipeline.
 * Usage: node simulate_trigger.js --type=AQI --city=Delhi --val=350
 */
const triggerEngine = require('./services/triggerService');
require('./services/claimService'); // Attach listeners
const pool = require('./db');

const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, val] = arg.replace('--', '').split('=');
    acc[key] = val;
    return acc;
}, {});

const type = args.type || 'AQI';
const city = args.city || 'Delhi';
const val = parseFloat(args.val || 350);

async function runStaticSimulation() {
    console.log(`\n🚀 [Simulator] Starting Manual Injection: ${type} in ${city} (Value: ${val})`);
    
    // 1. Get City Center (Mocked for demo)
    const centers = {
        'Delhi': { lat: 28.6139, lng: 77.2090 },
        'Hyderabad': { lat: 17.3850, lng: 78.4867 },
        'Mumbai': { lat: 19.0760, lng: 72.8777 }
    };
    
    const center = centers[city] || centers['Delhi'];
    let eventType = '';
    let severity = '';

    if (type === 'AQI') {
        eventType = 'Air Quality Disruption';
        severity = `AQI Index ${val} (Simulated)`;
    } else if (type === 'RAIN') {
        eventType = 'Extreme Weather (Rain)';
        severity = `Precipitation ${val} mm/hr (Simulated)`;
    }

    // 2. Fire the trigger (this kicks off the ClaimService pipeline via Events)
    try {
        await triggerEngine.fireTrigger(eventType, severity, city, center, 5.0);
        
        console.log(`✅ [Simulator] Trigger signal successfully broadcasted.`);
        console.log(`⏳ [Simulator] Waiting 5 seconds for pipeline logs...`);
        
        setTimeout(() => {
            console.log(`\n🏁 [Simulator] Simulation finished. Check database for created claims/payouts.`);
            process.exit(0);
        }, 5000);

    } catch (err) {
        console.error('❌ [Simulator] Failed to fire trigger:', err);
        process.exit(1);
    }
}

runStaticSimulation();
