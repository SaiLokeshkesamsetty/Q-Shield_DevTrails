const pool = require('./db');

async function testLogin(email, password) {
    try {
        const res = await pool.query('SELECT * FROM workers WHERE email = $1', [email]);
        console.log(`\nLooking up: ${email}`);
        console.log(`Found: ${res.rows.length > 0}`);
        if (res.rows.length > 0) {
            const w = res.rows[0];
            console.log(`DB Password: "${w.password}"`);
            console.log(`Input Password: "${password}"`);
            console.log(`Match: ${w.password === password}`);
        }
    } catch(e) {
        console.error('Error:', e.message);
    } finally {
        process.exit();
    }
}

testLogin('sai@gmail.com', '2005');
