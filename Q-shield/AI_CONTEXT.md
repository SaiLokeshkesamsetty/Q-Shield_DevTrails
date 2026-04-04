# Q-Shield: Parametric Insurance Platform (AI Context Document)

## Overview
Q-Shield is a real-time, AI-driven parametric insurance platform specifically designed for Gig Economy delivery partners (Blinkit, Swiggy, Zomato). It provides zero-touch, automated micro-payouts triggered by external API data (weather, traffic anomalies) rather than manual claims.

## Tech Stack
-   **Frontend**: React 18 (Vite), Tailwind CSS (w/ custom keyframes), React Router v6, Chart.js, React-Hot-Toast.
-   **Backend**: Node.js, Express.js.
-   **Database**: PostgreSQL (schema-driven).

## Core Architecture Design
The architecture is divided into a decoupled Client-Server model. However, for **Hackathon Demo Stability**, the frontend implements a "Hybrid Mock Pattern" within `src/api.js`. If the Node.js backend throws a network error, `api.js` seamlessly catches it and utilizes an internal `mockState` to keep the UI fully operational (including database trigger states, chart data arrays, and auth).

---

## Workspace Directory Structure

### 1. Frontend (`/frontend/src/`)
#### 🧩 Components (Pages)
-   **`LandingPage.jsx`**: Public marketing page. Showcases value props, static demo visualizations, and routes to `/auth`.
-   **`AuthPage.jsx`**: Centralized authentication router.
    -   *Worker Mode*: Login via Email/Password or Register (captures Name, Email, Gig Platform, Work Area, Password).
    -   *Admin Mode*: Secure entry for administrators (`admin` / `2005`).
-   **`WorkerDashboard.jsx`**: The delivery partner's portal. Shows active coverage limits, real-time local risk level, and includes a **"Simulate Rain Trigger"** button to physically demonstrate the parametric workflow.
-   **`ProfilePage.jsx`**: Displays a verified worker's identity, linked UPI/platform details, and coverage validity.
-   **`AdminDashboard.jsx`**: The centralized "AI Command Center". 
    -   Displays live global risk heatmaps, KPI aggregate metrics (+12% YoY tracking), and payout velocity charts utilizing `react-chartjs-2`.
    -   Includes an **AI Insights** telemetry module and a live-updating stream of automated parametric triggers.
    -   Contains a global "Simulate Anomaly" toggle for presenter demonstrations.
-   **`PolicyPage.jsx` & `ClaimsPage.jsx`**: Specific isolated views for policy terms and historical transaction logs.

#### ⚙️ Utilities & State
-   **`App.jsx`**: The root component. Handles React Router `<Routes>`, renders the global dynamic component `<Navigation>` (watches authenticated user state), and sets up global wrappers.
-   **`api.js`**: The critical abstraction layer. Defines all Axios REST queries pointing to `http://localhost:5000/api`. Intercepts errors to apply the `mockState` environment (dummy Workers, liveRisk, and simulated Claims structures).
-   **`index.css` & `tailwind.config.js`**: Houses global variables, Google font imports (Inter, Outfit), and highly customized Tailwind keyframe animations containing advanced UI logic (e.g., `blob`, `gradient-x`, glassmorphism logic).

### 2. Backend (`/backend/`)
#### 🌐 Controllers & Routes (`/routes`)
-   **`workerRoutes.js`**: Handles worker creation, profile fetching, and specific worker payload analytics.
-   **`triggerRoutes.js`**: The parametric entry point. Listens for external Webhooks (e.g., APIs from Indian Meteorological Department), evaluates the thresholds, and triggers events.
-   **`policyRoutes.js`**: Policy issuance logic and premium quote calculation logic.
-   **`claimRoutes.js`**: Standard historic payout fetching logs.

#### 🧠 Business Logic (`/services`)
-   **`triggerService.js`**: Core mechanism. Contains the algorithmic logic to determine if an incoming event (e.g. `rainfall_mm > 80`) qualifies for an instant payout tied to policies in that `zone_id`.
-   **`claimService.js`**: Initiates database transactions. Executes payouts against bank logic/UPI mocks upon parametric trigger validation.
-   **`premiumService.js`**: Evaluates dynamically shifting insurance pricing models based on ongoing zone risk and historical triggers.

#### 🗄️ Database
-   **`schema.sql`**: Comprehensive structured PostgreSQL definitions mapping relational constraints between `Workers (1) -> (M) Policies (1) -> (M) Claims`. Contains normalized `Triggers_Log` for systemic auditing.

---

## Platform Data Flow (Parametric Payout Demo Sequence)
1. **Enrollment**: A Worker signs up via `AuthPage.jsx` providing a specific `Work Area / Zone`.
2. **Monitoring**: `WorkerDashboard.jsx` initializes and begins periodic polling against `getRisk()`.
3. **Trigger Recognition**: A simulated event (e.g., "Heavy Rain") is manually fired via `simulateRainTrigger()`.
4. **Validation Pipeline**: The `zone_id` is sent to the backend. `triggerService.js` evaluates the severity threshold.
5. **Instant Execution**: The server evaluates to `true`, instantly marks the global risk as `HIGH`, injects an `APPROVED` micro-payout, and writes an audit log.
6. **Telemetry Broadcast**: The UI instances sync. The Worker visually receives their payout toast notification. Concurrently, the `AdminDashboard.jsx` sync sweeps visual components: the `<Line>` chart shoots up, the Heatmap grid pulses red for the hit zone, and the Active Trigger feed drops in the new anomaly flag.

*This system context empowers any AI assistant to clearly understand component relationships and API intent without parsing hundreds of lines of code locally.*
