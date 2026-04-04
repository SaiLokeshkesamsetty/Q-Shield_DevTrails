const pool = require('./db');

async function checkWorkers() {
    try {
        const res = await pool.query('SELECT worker_id, name, email, password, home_zone, tier FROM workers');
        console.log(`\n✅ Found ${res.rows.length} workers in database:\n`);
        res.rows.forEach(w => {
            console.log(`  Name: ${w.name}`);
            console.log(`  Email: ${w.email}`);
            console.log(`  Password: ${w.password}`);
            console.log(`  Zone: ${w.home_zone} | Tier: ${w.tier}`);
            console.log('  ---');
        });
    } catch(e) {
        console.error('❌ Error:', e.message);
    } finally {
        process.exit();
    }
}

checkWorkers();
