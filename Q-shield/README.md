# Q-Shield: AI-Driven Parametric Resilience
### Protecting Gig Income through Scalable, Data-Triggered Insurance

**Q-Shield** is a production-ready, AI-powered parametric insurance platform specifically engineered for gig delivery partners. By replacing traditional, delay-prone claims with data-driven micro-payouts, Q-Shield ensures that when environmental conditions disrupt work, financial protection is instantaneous and frictionless.

---

## 📽️ Submission Deliverables

### [Pitch Deck]
**View our Vision for Gig Resilience:**  
[👉 CLICK HERE TO VIEW PITCH DECK](https://link-to-your-pitch-deck.com)

### [Recorded Video]
**Watch the Q-Shield Platform in Action:**  
[🎥 WATCH DEMO VIDEO](https://link-to-your-demo-video.com)

---

## 🏗️ Technical Architecture
Q-Shield utilizes a decoupled microservices architecture designed for reliability and low-latency decision making.

**System Flow:**
`WeatherAPI` → `Node.js Gateway` → `Python ML Engine` → `Risk Analysis` → `Dynamic Premium/Payout` → `React HUD Component`

- **Core API Gateway (Node.js)**: Manages real-time event streams, policy state, and UPI settlement logic.
- **AI Microservice (Python/FastAPI)**: A specialized inference engine that processes complex environmental vectors in sub-second timeframes.
- **Parametric Execution**: An automated trigger system that cross-references TomTom Traffic and atmospheric sensors against worker GPS telemetry.

---

## 🧠 AI Forecasting & Dynamic Pricing Engine
Q-Shield integrates a proactive risk pricing system that moves beyond reactive coverage.

*   **7-Day Climatic Integration**: Real-time ingestion from WeatherAPI to project impending disruptions at the zone level.
*   **Predictive Premium Modeling**: Utilizing historical disruption frequency and forecasted severity to generate fair, actuarial-backed quotes.
*   **Explainable AI (XAI)**: Every score includes a transparency layer, allowing both admins and workers to understand the risk contributors (e.g., "High risk detected due to cumulative rainfall (120mm) and increased traffic congestion").
*   **Administrative Governance**: A specialized underwriting console allows for manual policy overrides with built-in audit trails and automated expiry logic.

**“This transforms Q-Shield from reactive insurance into a proactive risk pricing system.”**

---

## 🛠️ Machine Learning Core
We utilize a multi-model ensemble approach to ensure platform integrity and accuracy:

*   **Gradient Boosting Regressor**: Dynamically scores risk severity by analyzing the compounded impact of overlapping events (e.g., severe precipitation coupled with high traffic).
*   **Random Forest Classifier**: Runs behavioral anomaly detection to identify velocity fraud (geo-hopping) and multi-claim abuse in real-time.
*   **Performance**: Sub-second inference (<1s) achieved through lightweight ML models and local result caching.

---

## 🛰️ Situational Awareness UI
- **Telemetry HUD**: A glassmorphic interface providing workers with real-time situational awareness (AQI, Rain Intensity, Temp).
- **Scenario Manager**: A simulation deck for administrators to test system resilience against pre-defined disaster scenarios like **Monsoon Crisis** or **Toxic Smog**.

---

## ❤️ Why Q-Shield Matters
In the gig economy, a rainstorm isn't just a weather event—it's a sudden loss of income. Traditional insurance requires weeks of documentation and manual auditing, which doesn't help a worker pay today's bills.

Q-Shield ensures:
*   **Zero-Touch Payouts**: Funds are released the moment the threshold is hit.
*   **Predictive Protection**: Workers are alerted to high-risk periods before they start.
*   **No Claim Friction**: Removing the "Proof of Loss" burden from the worker and placing it on reliable data sensors.

---

## 🚀 Execution & Setup

### 1. Repository Initialization
```bash
git clone https://github.com/SaiLokeshkesamsetty/Q-Shield_DevTrails.git
cd Q-Shield_DevTrails
npm run install:all
```

### 2. Environment Setup
Create a `.env` in the root directory:
```env
DATABASE_URL=your_db_connection_string
WEATHER_API_KEY=your_openweather_key
JWT_SECRET=your_secret_key
```

### 3. Launch Platform
```bash
npm run dev
```

---

## 📅 Future Roadmap
- **Blockchain Oracle Integration**: Moving the parametric ledger to a public chain (Polygon) for immutable trust.
- **Computer Vision Verification**: Lightweight ResNet models to verify flooding via user-submitted imagery.
- **Advanced Streaming**: Transitioning to Apache Flink for true sliding-window geo-telemetry analysis.

---
*Developed for the Guidewire DEVTrails Hackathon 2026.*
