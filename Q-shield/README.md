# Q-Shield Phase 3: AI-Driven Parametric Risk Engine

Q-Shield has evolved from heuristic rules to a production-grade, AI-driven parametric insurance platform specifically engineered for gig delivery partners.

![Q-Shield Ecosystem](https://img.shields.io/badge/Status-Phase_3_Active-success?style=for-the-badge&logo=appveyor)

## 🧠 Truly AI-Driven Operations
We completely replaced rule-based `if/else` checks with real-time ML predictors powered by Python and Scikit-Learn:
* **Gradient Boosting Regressor**: Dynamically scores risk severity by recognizing the compounded danger of overlapping events (e.g., severe traffic gridlock *during* torrential rain).
* **Random Forest Classifier**: Runs strict behavioral anomaly detection to catch velocity fraud (geo-hopping) and multi-claim abuse in real-time.
* **Explainable AI (XAI) UI**: Our custom-built "Intelligence Breakdown" radar visualizes exactly how the models weight different environmental factors to determine premiums.

---

## 🛰 Situational Awareness & Worker HUD
We've moved beyond static dashboards by implementing a **Situational Telemetry HUD** for workers. This provides real-time, glassmorphic atmospheric data (AQI, Rain, Temp) directly in the mobile-responsive interface, turning an insurance tool into a vital safety cockpit.

---

## 🏗 Real-Time Microservices Architecture
The monolith has been decoupled:
- `backend/core/` **Node.js Gateway**: Handles Event streams (triggering, polling, idempotency) and UPI Settlement via Razorpay.
- `backend/ai_engine/` **FastAPI (Python)**: Dedicated inference microservice (`/api/predict_risk`, `/api/predict_fraud`) for calculating actuarial multipliers with <50ms latency.

### Flow Diagram
```text
[External Data] (Weather/Traffic) 
       +                     
[Mobile APP GPS] (Live Worker Geo) 
       |                     
       v                     
 [ API Gateway ] (Node/Express)
       |                     
       +--> [ Event Stream ] (Redis Pub/Sub or Kafka lite)
                   |
     +-------------+-------------+
     |                           |
[ AI Risk Engine ]      [ Fraud Detection Engine ]
(Python + Scikit-Learn) (Behavioral/Geo Analytics)
     |                           |
     +-----> [ Decision & Scoring ] <-----+
                   |
        [ Claim Processing ] (Node.js)
        (Calculates Dynamic Payouts)
                   |
        [ Settlement Gateway ] (Razorpay UPI)
```

---

## 🔍 Behavioral Analytics & Edge Cases
- **Concurrent Disruptions**: The Risk Inference engine automatically scales up payouts natively via its ML training dataset when multiple disasters strike.
- **Velocity Fraud Prevention**: Worker geo-traces and claims-per-week histories are analyzed. High-frequency claim loops are instantly identified by the ML network prior to settlement.
- **Dynamic Pricing Model**: Risk models enable dynamic premiums based on historical behavior and risk zone frequency.

---

## 🚀 Tech Stack
- **Frontend**: React, TailwindCSS, Chart.js, Lucide Icons, Vite
- **Core Backend**: Node.js, Express, PostgreSQL
- **AI Microservice**: Python, FastAPI, Scikit-Learn, Pandas
- **Integrations**: TomTom Traffic API, OpenWeatherAPI, Supabase Auth

---

## 📅 Roadmap for Phase 4 (Future Improvements)
To fully capture enterprise readiness for Phase 4 considerations:
1. **Streaming Anomaly Detection (Kafka & Flink)**: Moving from REST API triggers to streaming data so location paths are analyzed via sliding time windows.
2. **Computer Vision Claim Adjunct**: Allowing workers to attach pictures of disaster zones. A lightweight ResNet model can verify flooding parameters locally.
3. **Smart Contract Automation**: Replace the internal ledger with an Ethereum or Polygon smart contract, where the AI Risk Engine acts as an Oracle.
