const pool = require('./db');
async function run() {
    try {
        const query = `
            SELECT c.* 
            FROM claims c 
            JOIN policies p ON c.policy_id = p.policy_id 
            JOIN workers w ON p.worker_id = w.worker_id 
            WHERE w.email = 'sai@gmail.com' 
            ORDER BY c.created_at DESC 
            LIMIT 5
        `;
        const res = await pool.query(query);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
