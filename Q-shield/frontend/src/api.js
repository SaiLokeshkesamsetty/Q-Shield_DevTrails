import axios from 'axios';

const API_BASE = '/api';

// Sync current environment state
const isProd = window.location.hostname !== 'localhost';

export const mockState = {
  isPolicyActive: false,
  liveRisk: 'LOW',
  riskReason: 'Clear Skies',
  triggersLog: [
    { type: 'TRAFFIC', zone: 'ZONE_ALPHA', time: new Date(Date.now() - 3600000).toISOString() }
  ],
  workers: [
      { worker_id: 'W_DEMO', name: 'Rahul (Demo User)', home_zone: 'Hyderabad', email: 'rahul@gmail.com', platform: 'Blinkit' }
  ]
};

export const fetchWorkers = async () => {
    try {
        const res = await axios.get(`${API_BASE}/workers`);
        return res.data;
    } catch (e) {
        return mockState.workers;
    }
};

export const registerWorker = async (data) => {
    try {
        const res = await axios.post(`${API_BASE}/workers/auth`, {
            name: data.name, email: data.email, password: data.password, 
            platform: data.platform, zone: data.zone, latitude: data.latitude, longitude: data.longitude
        });
        return { success: true, worker: res.data };
    } catch(e) {
        console.error("Supabase Registration Failed:", e.response?.data?.error || e.message);
        return { success: false, error: e.response?.data?.error || "Database connection error" };
    }
};

export const loginWorker = async (email, password) => {
    try {
        const res = await axios.post(`${API_BASE}/workers/auth`, { email, password });
        return { success: true, worker: res.data };
    } catch(e) {
        console.error("Login Failed:", e.response?.data?.error || e.message);
        return { success: false, error: e.response?.data?.error || "Invalid credentials" };
    }
};

export const loginAdmin = async (username, password) => {
    if(username === 'admin' && password === '2005') return { success: true };
    return { success: false };
};

export const fetchDashboard = async (workerId) => {
    try {
        const res = await axios.get(`${API_BASE}/workers/${workerId}/dashboard`);
        return res.data;
    } catch (e) {
        return {
            liveRiskLevel: mockState.liveRisk,
            riskReason: mockState.riskReason,
            activeCoverage: mockState.isPolicyActive ? { policy_id: 'POL_TEST', coverage_amount: 2000, premium_amount: 50, start_date: new Date().toISOString() } : null,
            latestPayouts: [
                { id: 'P_1', amount: 250, paid_at: new Date().toISOString() }
            ],
            claimsHistory: [
                { claim_id: 'C_DEMO', amount: 250, status: 'Paid', processing_step: 'Completed', created_at: new Date().toISOString() }
            ],
            currentPremiumQuote: 50,
            // 📡 Bulletproof Telemetry Defaults
            aqi: 42,
            rainfall: 0,
            temperature: 32,
            zone: 'Guntur Nexus'
        };
    }
};

export const getRisk = async () => {
   try {
       const res = await axios.get(`${API_BASE}/risk`);
       return res.data;
   } catch(e) {
       return { risk: mockState.liveRisk, reason: mockState.riskReason };
   }
}

export const purchasePolicy = async (workerId, premiumAmount) => {
    try {
        await axios.post(`${API_BASE}/policies/purchase`, { worker_id: workerId, premium_amount: premiumAmount });
    } catch(e) { console.warn("Backend error, using mock policy purchase."); }
    mockState.isPolicyActive = true;
};

export const simulateRainTrigger = async (type = 'RAIN', zone, lat = null, lng = null, workerId = null, mode = 'LIVE') => {
    try {
        await axios.post(`${API_BASE}/admin/simulate-trigger`, { triggerType: type, zone, lat, lng, workerId, mode });
        return { success: true };
    } catch(e) {
        console.warn("Backend simulation error:", e.response?.data?.error || e.message);
        return { success: false };
    }
};

export const fetchAllClaims = async () => {
     try {
         const res = await axios.get(`${API_BASE}/claims`);
         return res.data;
     } catch(e) { return mockClaims; }
};

export const fetchAdminAnalytics = async () => {
     try {
         const res = await axios.get(`${API_BASE}/admin/analytics`); 
         return res.data;
     } catch(e) {
         return {
             totalClaims: mockClaims.length,
             paidClaims: mockClaims.length,
             totalPayouts: mockClaims.reduce((acc, c) => acc + (c.payout_amount || c.amount || 0), 0),
             totalPremiums: 200,
             activePolicies: 4,
             totalWorkers: mockState.workers.length,
             bcr: 0.25,
             lossRatio: 0.12,
             triggers: mockState.triggersLog,
             workers: mockState.workers
         };
     }
};

export const updateWorkerStatus = async (workerId, latitude, longitude, mode = 'LIVE') => {
    try {
        const res = await axios.patch(`${API_BASE}/workers/${workerId}/status`, { latitude, longitude, mode });
        return { success: true, worker: res.data };
    } catch(e) {
        console.error("Status Update Failed:", e.message);
        return { success: false };
    }
};

export const getWorkerProfile = async (workerId) => {
    try {
        const res = await axios.get(`${API_BASE}/workers/${workerId}/profile`);
        return res.data;
    } catch (e) {
        console.error("Failed to fetch worker profile:", e.message);
        return null;
    }
};

export const updateWorkerProfile = async (workerId, updateData) => {

    try {
        const res = await axios.patch(`${API_BASE}/workers/${workerId}/profile`, updateData);
        return { success: true, data: res.data };
    } catch(e) {
        console.error("Profile Update Failed:", e.message);
        return { success: false, error: e.message };
    }
};

export const fetchZoneForecast = async (zone) => {
    try {
        const res = await axios.get(`${API_BASE}/admin/forecast?zone=${encodeURIComponent(zone)}`);
        return res.data;
    } catch(e) {
        console.error("Failed to fetch 7-day forecast:", e.message);
        return null; // Handle generically in UI
    }
};

export const overrideWorkerPremium = async (workerId, customPremium, aiSuggestedPremium, reason, expiresAt) => {
    try {
        const res = await axios.post(`${API_BASE}/admin/workers/${workerId}/premium`, {
            customPremium, aiSuggestedPremium, reason, expiresAt
        });
        return { success: true, data: res.data };
    } catch(e) {
        console.error("Failed to override premium:", e.message);
        return { success: false, error: e.response?.data?.error || e.message };
    }
};

export const fetchWorkerPremium = async (workerId) => {
    try {
        const res = await axios.get(`${API_BASE}/workers/${workerId}/premium`);
        return res.data;
    } catch(e) {
        console.error("Failed to fetch dynamic premium:", e.message);
        return null;
    }
};

export const verifyGigPlatform = async (workerId, platform, screenshot) => {
    try {
        const res = await axios.post(`${API_BASE}/workers/${workerId}/verify-gig-app`, { platform, screenshot });
        return res.data;
    } catch(e) {
        console.error("Gig Verification Error:", e.message);
        return { success: false, error: e.response?.data?.error || e.message };
    }
};
