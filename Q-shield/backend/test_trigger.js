const engine = require('./services/triggerService');
require('./services/claimService');

async function test() {
    console.log("Mocking trigger...");
    await engine.mockTriggerFire('RAIN', 'Hyderabad', 17.3850, 78.4867, 'e848754b-7691-4fb6-b145-4596cd22832b');
    
    // give it 5 seconds to process
    setTimeout(() => {
        console.log("Done.");
        process.exit();
    }, 5000);
}

test();
