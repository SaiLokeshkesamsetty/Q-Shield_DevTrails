async function testEndpoint() {
    try {
        console.log("Sending POST to http://localhost:5000/api/admin/simulate-trigger ...");
        const res = await fetch('http://localhost:5000/api/admin/simulate-trigger', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                triggerType: 'RAIN',
                zone: 'Hyderabad',
                lat: 16.30857090,
                lng: 80.44245397,
                workerId: 'e848754b-7691-4fb6-b145-4596cd22832b'
            })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch(e) {
        console.error("Error:", e.message);
    }
}
testEndpoint();
