const { calculateDynamicPremium } = require('./services/premiumService');
const triggerService = require('./services/triggerService');

async function test() {
    try {
        console.log("Testing dashboard logic...");
        const zone = "Hyderabad";
        const prem = calculateDynamicPremium(zone);
        console.log("Premium:", prem);
        const risk = await triggerService.getLiveRiskForZone(zone);
        console.log("Risk:", risk);
        console.log("Test Passed!");
    } catch (e) {
        console.error("Test Failed:", e);
    }
    process.exit(0);
}

test();
