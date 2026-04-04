CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS workers (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    platform VARCHAR(50),
    upi_id VARCHAR(100),
    home_zone VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    last_location JSONB DEFAULT '{"lat": 0, "lng": 0}',
    active_days_last_30 INT DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'LOW',
    last_active_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    trust_score INT DEFAULT 100,
    mode VARCHAR(20) DEFAULT 'LIVE', -- 'LIVE' or 'DEMO'
    phone_number VARCHAR(20),
    bank_details JSONB DEFAULT '{"mask": "XXXX1234", "bank": "HDFC Bank", "verified": true}',
    notification_preferences JSONB DEFAULT '{"claim_alerts": true, "payout_notifications": true, "risk_alerts": true}',
    profile_image_url TEXT,
    kyc_status VARCHAR(50) DEFAULT 'Verified',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policies (
    policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(worker_id),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    premium_paid DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS triggers (
    trigger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50),
    severity_value VARCHAR(50),
    zone VARCHAR(100),
    zone_center JSONB DEFAULT '{"lat": 0, "lng": 0}',
    radius_km DECIMAL DEFAULT 5.0,
    severity_numeric DECIMAL DEFAULT 0.0,
    trigger_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    recorded_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS claims (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID REFERENCES policies(policy_id),
    trigger_id UUID REFERENCES triggers(trigger_id),
    payout_amount DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'Pending',
    processing_step VARCHAR(100),
    mode VARCHAR(20) DEFAULT 'LIVE',
    failed_stage VARCHAR(50), -- 'THRESHOLD', 'ELIGIBILITY', 'FRAUD'
    rejection_reason TEXT,
    calculation_metadata JSONB,
    duration_hours INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_policy_trigger UNIQUE (policy_id, trigger_id)
);

CREATE TABLE IF NOT EXISTS payouts (
    payout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(claim_id),
    worker_id UUID REFERENCES workers(worker_id),
    amount DECIMAL(10,2),
    payment_status VARCHAR(50) DEFAULT 'Mock_Paid',
    paid_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disruption_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(worker_id),
    zone VARCHAR(255),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Init Seed
INSERT INTO workers (worker_id, name, platform, upi_id, home_zone) 
VALUES 
('d1111111-1111-1111-1111-111111111111', 'Rahul Kumar', 'Zepto', 'rahul@upi', 'ZONE_ALPHA')
ON CONFLICT DO NOTHING;
