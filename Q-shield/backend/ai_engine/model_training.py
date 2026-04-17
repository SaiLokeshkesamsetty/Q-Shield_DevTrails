import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

# ---------------------------------------------
# 1. Fraud Detection Model (Classification)
# ---------------------------------------------
# Features: distance_from_trigger (km), claims_last_7_days, claim_time_hour
# Target: is_fraudulent (0 = Legit, 1 = Fraud)

def train_fraud_model():
    print("Training Fraud Detection Model...")
    np.random.seed(42)
    n_samples = 5000
    
    distance = np.random.exponential(scale=3, size=n_samples)
    recent_claims = np.random.poisson(lam=1.5, size=n_samples)
    claim_hour = np.random.randint(0, 24, size=n_samples)
    
    # Fraud logic: Too far away OR unusually high claim frequency
    is_fraud = ((distance > 5.0) | (recent_claims > 5)).astype(int)
    
    df = pd.DataFrame({'distance': distance, 'recent_claims': recent_claims, 'hour': claim_hour, 'fraud': is_fraud})
    
    X = df[['distance', 'recent_claims', 'hour']]
    y = df['fraud']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train, y_train)
    
    model_path = os.path.join(os.path.dirname(__file__), 'fraud_model.pkl')
    joblib.dump(clf, model_path)
    print(f"Fraud Model Accuracy: {clf.score(X_test, y_test)*100:.1f}%")
    print(f"Saved to {model_path}")

# ---------------------------------------------
# 2. Dynamic Risk Scoring Model (Regression)
# ---------------------------------------------
# Features: rain_mm, aqi, temperature, traffic_delay_min
# Target: severity_score (0.0 to 100.0)

def train_risk_model():
    print("Training Risk Scoring Model...")
    np.random.seed(42)
    n_samples = 5000
    rain = np.random.uniform(0, 100, n_samples)
    aqi = np.random.uniform(50, 500, n_samples)
    temp = np.random.uniform(20, 48, n_samples)
    traffic = np.random.uniform(0, 120, n_samples)
    
    # Non-linear weighting: Multi-disasters multiply the severity risk
    severity = (rain * 0.4) + (aqi * 0.1) + (traffic * 0.3) + np.where((rain > 50) & (traffic > 40), 20, 0)
    severity = np.clip(severity, 0, 100) # Normalize to 100
    
    df = pd.DataFrame({'rain': rain, 'aqi': aqi, 'temp': temp, 'traffic': traffic, 'severity': severity})
    
    X = df[['rain', 'aqi', 'temp', 'traffic']]
    y = df['severity']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    reg = GradientBoostingRegressor(n_estimators=100, random_state=42)
    reg.fit(X_train, y_train)
    
    model_path = os.path.join(os.path.dirname(__file__), 'risk_score_model.pkl')
    joblib.dump(reg, model_path)
    print("Risk Scoring Engine Trained successfully.")
    print(f"Saved to {model_path}")

if __name__ == '__main__':
    train_fraud_model()
    train_risk_model()
