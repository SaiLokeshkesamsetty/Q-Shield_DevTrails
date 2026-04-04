const pool = require('./db');
async function run() {
    try {
        const res = await pool.query("SELECT worker_id, email, latitude, longitude, last_location, last_active_timestamp FROM workers WHERE email = 'sai@gmail.com'");
        console.log(JSON.stringify(res.rows[0], null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
