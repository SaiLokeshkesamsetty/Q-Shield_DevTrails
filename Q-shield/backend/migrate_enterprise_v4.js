const pool = require('./db');

async function migrate() {
    try {
        console.log('🚀 Starting Enterprise Migration (v4)...');

        // 1. Update Triggers Table: Numeric Severity
        await pool.query(`
            ALTER TABLE triggers 
            ADD COLUMN IF NOT EXISTS severity_numeric DECIMAL DEFAULT 0.0;
        `);

        // 2. Update Claims Table: Metadata, Duration, and Processing Step
        await pool.query(`
            ALTER TABLE claims 
            ADD COLUMN IF NOT EXISTS calculation_metadata JSONB DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS duration_hours INT DEFAULT 1,
            ADD COLUMN IF NOT EXISTS processing_step VARCHAR(50) DEFAULT 'Pending';
        `);

        // 3. Idempotency Constraint: Prevent duplicate claims for the same trigger
        await pool.query(`
            ALTER TABLE claims 
            DROP CONSTRAINT IF EXISTS unique_worker_trigger;
            
            ALTER TABLE claims 
            ADD CONSTRAINT unique_worker_trigger UNIQUE (policy_id, trigger_id);
        `);

        console.log('✅ Enterprise Migration Complete: Schema is resilient and data-driven.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
        process.exit(1);
    }
}

migrate();
