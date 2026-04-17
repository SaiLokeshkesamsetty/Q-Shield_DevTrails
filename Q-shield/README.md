# Q-Shield: The Resilience Core
### AI-Driven Parametric Risk Engine for the Gig Economy

**Q-Shield** is a production-grade, AI-driven parametric insurance platform specifically engineered for gig delivery partners (Blinkit, Swiggy, Zomato). By replacing manual claims with zero-touch, data-triggered micro-payouts, Q-Shield ensures that when the climate fails, the worker's income doesn't.

---

## 📽️ Submission Deliverables

### [Pitch Deck]
> [!IMPORTANT]
> **View our Vision for Gig Resilience here:**  
> [👉 CLICK HERE TO VIEW PITCH DECK](https://link-to-your-pitch-deck.com) *(USER: Please update this link)*

### [Recorded Video]
> [!TIP]
> **Watch the Q-Shield Platform in Action:**  
> [🎥 WATCH DEMO VIDEO](https://link-to-your-demo-video.com) *(USER: Please update this link)*

---

## 🏗️ Elite Technical Architecture

Q-Shield utilizes a decoupled microservices architecture designed for sub-50ms inference and zero-touch settlement.

- **`backend/core/` (Node.js)**: High-throughput gateway managing event streams, policy state, and UPI settlement via Razorpay.
- **`backend/ai_engine/` (Python/FastAPI)**: Dedicated ML inference service powering risk prediction and fraud detection.
- **Parametric Pipeline**: Automated trigger engine that cross-references TomTom Traffic and OpenWeather APIs against worker GPS telemetry.

### Logic Flow
1. **Telemetry**: Real-time GPS and weather data stream into the AI core.
2. **Inference**: Gradient Boosting Regressors calculate compound risk severity (Rain + Heat + Traffic).
3. **Trigger**: If risk exceeds the parametric threshold, a payout is instantly authorized.
4. **Settlement**: Zero-touch funds transfer pushed via UPI in <5 seconds.

---

## 🧠 Truly AI-Driven Operations

Unlike traditional insurance, Q-Shield is powered by explainable actuarial models:
*   **Gradient Boosting Regressor**: Identifies the compounded danger of overlapping events.
*   **Random Forest Classifier**: Runs behavioral anomaly detection for fraud prevention.
*   **Explainable AI (XAI)**: A custom UI radar that visualizes how rainfall, temperature, and historical frequency weighted the final risk score.

---

## 🛰️ Situational UI & Elite UX
- **Mission-Critical HUD**: Workers receive a glassmorphic "Situational Awareness" HUD with real-time atmospheric telemetry.
- **Simulation Command Deck**: Admins can trigger complex disaster scenarios (**Monsoon Crisis**, **Toxic Smog**, **Black Swan**) to test system resilience in real-time.

---

## 🛠️ Local Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- PostgreSQL (or Supabase)

### 1. Repository Setup
```bash
git clone https://github.com/SaiLokeshkesamsetty/Q-Shield_DevTrails.git
cd Q-Shield_DevTrails
npm run install:all
```

### 2. Environment Configuration
Create a `.env` in the root:
```env
DATABASE_URL=your_db_url
WEATHER_API_KEY=your_key
JWT_SECRET=your_secret
```

### 3. Execution
Run both servers simultaneously:
```bash
npm run dev
```

---

## 🚀 Roadmap: Phase 4 & Beyond
1. **Streaming Anomaly Detection**: Transitioning to Kafka/Flink for sliding-window location analysis.
2. **Computer Vision Claim Adjunct**: Local ResNet verification of disaster-zone imagery.
3. **Smart Contract Settlement**: Moving the parametric ledger to the Polygon blockchain using the AI Engine as an Oracle.

---

*Developed for the Guidewire DEVTrails Hackathon 2026.*
