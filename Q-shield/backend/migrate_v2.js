const pool = require('./db');

async function migrate() {
    try {
        console.log('🚀 Starting Schema Migration v2...');

        // 1. Update Workers Table
        await pool.query(`
            ALTER TABLE workers 
            ADD COLUMN IF NOT EXISTS last_location JSONB DEFAULT '{"lat": 0, "lng": 0}',
            ADD COLUMN IF NOT EXISTS active_days_last_30 INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'LOW',
            ADD COLUMN IF NOT EXISTS last_active_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✅ Workers table updated.');

        // 2. Update Triggers Table
        await pool.query(`
            ALTER TABLE triggers 
            ADD COLUMN IF NOT EXISTS zone_center JSONB DEFAULT '{"lat": 0, "lng": 0}',
            ADD COLUMN IF NOT EXISTS radius_km DECIMAL DEFAULT 5.0,
            ADD COLUMN IF NOT EXISTS trigger_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('✅ Triggers table updated.');

        // 3. Update Claims Table (adding status tracker)
        await pool.query(`
            ALTER TABLE claims 
            ADD COLUMN IF NOT EXISTS processing_step VARCHAR(50) DEFAULT 'Triggered';
        `);
        console.log('✅ Claims table updated.');

        console.log('🎉 Migration v2 completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
