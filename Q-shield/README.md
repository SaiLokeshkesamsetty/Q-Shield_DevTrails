

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
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000    **(Ensure the port is free. If occupied, update the port in the frontend configuration.)**
- **AI Engine (Uvicorn)**: http://localhost:8000

---



---
## 🏁 Conclusion
Q-Shield is not just an insurance platform — it is a real-time AI-powered risk intelligence system that predicts, prices, and protects gig worker income before disruption occurs.
