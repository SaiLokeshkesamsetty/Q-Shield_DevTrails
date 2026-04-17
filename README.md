# 🛡️ Q-Shield: The Income-Protection Layer for the Gig Economy
### Autonomous, AI-Driven Parametric Insurance for Quick-Commerce Delivery Partners.

**Q-Shield** is a production-ready, AI-powered parametric insurance platform specifically engineered for gig delivery partners (Blinkit, Swiggy, Zomato). By replacing traditional, delay-prone claims with data-driven micro-payouts, Q-Shield ensures that when environmental conditions disrupt work, financial protection is instantaneous and frictionless.

---

## 📽️ Submission Deliverables

### [Pitch Deck]
**View our Vision for Gig Resilience:**  
[👉 CLICK HERE TO VIEW PITCH DECK](https://link-to-your-pitch-deck.com)

### [Recorded Video]
**Watch the Q-Shield Platform in Action:**  
[🎥 WATCH DEMO VIDEO](https://link-to-your-demo-video.com)

---

## 🌩️ The Problem: The Invisible Cost of Urban Disruption
Every day, millions of delivery partners lose their daily wages when heavy rain, toxic pollution, or extreme traffic gridlock force quick-commerce platforms to pause operations. **For a gig worker, no delivery means zero income.** 

Traditional insurance is too slow and too expensive for a worker earning ₹500 a day. They don't need a 30-day investigation; they need their lost wages replaced **instantly**.

---

## 🌩️ Why Parametric Insurance?
Parametric insurance is a revolutionary model where the payout is triggered by a **pre-defined event** (e.g., Rainfall > 20mm/hr) rather than a manual damage assessment.

| Feature | Traditional Insurance | 🛡️ Q-Shield (Parametric) |
| :--- | :--- | :--- |
| **Claim Process** | Manual forms, calls, and weeks of waiting | **Zero-Touch (Fully Automated)** |
| **Verification** | Human surveyors and manual audits | **Rule-Based (API + AI Sensors)** |
| **Payout Speed** | 15 - 45 Days | **Instant (Seconds after disruption)** |
| **Friction** | High (Documentation required) | **None (Autonomous detection)** |

---

## 🧠 AI Forecasting & Dynamic Pricing Engine
Q-Shield integrates a proactive risk pricing system that moves beyond reactive coverage.

*   **7-Day Climatic Integration**: Real-time ingestion from WeatherAPI to project impending disruptions at the zone level.
*   **AI Suggested Premium Output**: Generates dynamic pricing recommendations (e.g., ₹42 based on projected risk levels).
*   **Predictive Premium Modeling**: Utilizing historical disruption frequency and forecasted severity to generate actuarial-backed quotes.
*   **XAI Visibility**: Every score includes a transparency layer (e.g., "High risk detected due to cumulative rainfall (120mm) and increased traffic congestion").
*   **Administrative Governance**: Specialized underwriting console for manual overrides with audit trails and automated expiry logic.

**“This transforms Q-Shield from reactive insurance into a proactive risk pricing system.”**

---

## 🏗️ Technical Architecture
Q-Shield utilizes a decoupled microservices architecture designed for reliability and sub-second decision making.

**System Flow:**
`WeatherAPI` → `Node.js Gateway` → `Python ML Engine` → `Risk Analysis (Fraud Detection + Risk Scoring)` → `Dynamic Premium/Payout` → `React HUD`

- **Core API Gateway (Node.js)**: Manages real-time event streams, policy state, and UPI settlement logic.
- **AI Microservice (Python/FastAPI)**: A specialized inference engine that processes complex environmental vectors.
- **Parametric Execution**: An automated trigger system that cross-references real-time environmental APIs with worker GPS telemetry to trigger payouts instantly without manual claims.
- ⚡ **Real-time decision pipeline with sub-second latency**

### 🧠 Machine Learning Core
*   **Gradient Boosting Regressor**: Dynamically scores risk severity by analyzing compounded environmental alerts.
*   **Random Forest Classifier**: Runs behavioral anomaly detection to identify velocity fraud and geo-hopping.

---

## 🛰️ Situational UI & Product Showcase

### 1. 🚀 Situational Telemetry HUD
Workers receive a glassmorphic "Situational Awareness" HUD with real-time atmospheric telemetry (AQI, Rain Intensity, Temp).

### 2. 🧠 Admin Command Center (XAI Radar)
Admins can monitor global risk and visualize precisely how the AI engine weighted different factors to determine premiums.

### 3. 🔄 Scenario Manager
A simulation deck for administrators to test system resilience against scenarios like **Monsoon Crisis**, **Toxic Smog**, or **Black Swan**.

---

## ⚡ Live Demo Flow 

Experience the full autonomous lifecycle in under 60 seconds:

1.  **Login as Worker**: Use the available test credentials.
2.  **Go Online**: This primes your GPS telemetry and sets the system to monitoring mode.
3.  **Simulate Disruption**: Click the **"SIMULATE DISRUPTION"** button in the dashboard.
4.  **Watch the Pipeline**: The UI will refresh instantly to show the live claim processing through **Threshold**, **Eligibility**, **Fraud Check**, and **Payout**.
5.  **Verify History**: Go to the **History Tab** to see the transaction receipt and payout log.

---

## 🛠️ Local Installation & Setup

Q-Shield is a 3-tier platform (React + Node.js + Python ML). Follow these steps to deploy locally:

### 1. Repository & Dependency Setup
Ensure you have **Node.js (v18+)** and **Python (3.9+)** installed.
```bash
git clone https://github.com/SaiLokeshkesamsetty/Q-Shield_DevTrails.git
cd Q-Shield_DevTrails
npm run setup
```

### 2. Database Initialization
1. Create a PostgreSQL database (or use a service like Supabase).
2. Execute the schema script located at: **[backend/schema.sql]**.
3. This will create the necessary `workers`, `policies`, `triggers`, and `claims` tables required for the AI engine to function.

### 3. Environment Configuration
Create a `.env` in the root directory:
```env
DATABASE_URL=your_db_connection_string
WEATHER_API_KEY=your_openweather_key
TOMTOM_API_KEY=your_tom_api_key
JWT_SECRET=your_secret_key
```

### 4. Platform Execution
Launch the entire ecosystem (Frontend, Backend, and AI Engine) with one command:
```bash
npm run dev
```
- **Frontend port**: 5173
- **Backend API port**: 5000              **(Ensure the port is free. If occupied, update the port in the frontend configuration.)**
- **AI Engine (Uvicorn) port**:8000
  

---

## 🔮 Future Roadmap
1. **Streaming Anomaly Detection**: Transitioning to Kafka/Flink for sliding-window location analysis.
2. **Computer Vision Claim Adjunct**: Local ResNet verification of disaster-zone imagery.
3. **Smart Contract Settlement**: Moving the parametric ledger to the Polygon blockchain.

## ❤️ Why This Matters
At its core, **Q-Shield** is about human stability. It ensures that the people who power our modern commerce don't have to choose between their safety and their survival. **When the city stops, their income shouldn't.**

---
## 🏁 Conclusion
Q-Shield is not just an insurance platform — it is a real-time AI-powered risk intelligence system that predicts, prices, and protects gig worker income before disruption occurs.

**Designed with passion.**
