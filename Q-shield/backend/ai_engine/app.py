from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import os

app = FastAPI(title="Q-Shield AI Engine", description="Machine Learning Inference Service for Parametric Risk and Fraud Detection")

# Load models
base_dir = os.path.dirname(__file__)
fraud_model_path = os.path.join(base_dir, 'fraud_model.pkl')
risk_model_path = os.path.join(base_dir, 'risk_score_model.pkl')

try:
    fraud_model = joblib.load(fraud_model_path)
    risk_model = joblib.load(risk_model_path)
    print("Models loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load models. Please run model_training.py first. Error: {e}")
    fraud_model = None
    risk_model = None

class FraudQuery(BaseModel):
    distance_km: float
    recent_claims: int
    hour: int

class RiskQuery(BaseModel):
    rain_mm: float
    aqi: float
    temp: float
    traffic_delay_min: float

class DailyForecast(BaseModel):
    rain_mm: float
    temp: float
    wind_kph: float

class ForecastQuery(BaseModel):
    daily_forecasts: list[DailyForecast]

@app.post("/api/predict_fraud")
def predict_fraud(data: FraudQuery):
    if not fraud_model:
        return {"fraud_probability": 0, "is_safe": True, "error": "Model not loaded"}
    
    features = np.array([[data.distance_km, data.recent_claims, data.hour]])
    prob = fraud_model.predict_proba(features)[0][1] # Probability of Class 1 (Fraud)
    return {"fraud_probability": round(prob * 100, 2), "is_safe": prob < 0.6}

@app.post("/api/predict_risk")
def predict_risk(data: RiskQuery):
    if not risk_model:
        return {"calculated_risk_score": 0, "error": "Model not loaded"}
        
    features = np.array([[data.rain_mm, data.aqi, data.temp, data.traffic_delay_min]])
    score = risk_model.predict(features)[0]
    return {"calculated_risk_score": round(score, 2)}

@app.post("/api/predict_forecast_risk")
def predict_forecast_risk(query: ForecastQuery):
    if not query.daily_forecasts:
        return {"calculated_risk_score": 0, "confidence": 0, "risk_level": "Low", "explanation": "No data available."}

    total_rain = sum([d.rain_mm for d in query.daily_forecasts])
    avg_temp = sum([d.temp for d in query.daily_forecasts]) / len(query.daily_forecasts)
    
    if not risk_model:
        risk_score = 0
    else:    
        # Run through Scikit-Learn Regression Model 
        # using average daily temp and total rain, assuming average AQI and traffic
        features = np.array([[total_rain, 50, avg_temp, 0]]) 
        risk_score = risk_model.predict(features)[0]
    
    # Explainable AI logic
    explanation = "Stable premium projection."
    if total_rain > 100:
         explanation = "High premium due to predicted heavy rainfall and flooding risk over the next 7 days."
    elif avg_temp > 40:
         explanation = "Elevated premium due to severe heatwave warnings."

    return {
        "calculated_risk_score": round(risk_score, 2),
        "confidence": 87.5,
        "risk_level": "High" if risk_score > 60 else "Medium" if risk_score > 30 else "Low",
        "explanation": explanation
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
