require('dotenv').config();
const express = require('express');
const cors = require('cors');
const triggerService = require('./services/triggerService');

const path = require('path');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Main App Routes
app.use('/api/workers', require('./routes/workerRoutes'));
app.use('/api/policies', require('./routes/policyRoutes'));
app.use('/api/claims', require('./routes/claimRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Global Live Risk Telemetry
app.get('/api/risk', async (req, res) => {
    const zone = req.query.zone || 'Hyderabad';
    const riskData = await triggerService.getLiveRiskForZone(zone);
    res.json(riskData);
});

// 🚀 Production Static Serving (Disabled on Vercel, handled by edge rewrites)
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
    });
}


// 🚀 Boot Payout & Discovery Engines (Enforced for both Local & Production)
try {
    require('./services/claimService');
    triggerService.startMonitoring();
    console.log("🚦 [Server] Automation Engines (Claim/Trigger) Activated.");
} catch (err) {
    console.warn('[Server] Error booting background engines:', err.message);
}

// 🚀 Production Execution
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
