import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

class AnomalyDetectionService:
    def __init__(self):
        # Define paths to model files
        self.model_dir = Path(__file__).parent.parent / "anomaly_detector_model"
        
        # Initialize variables
        self.model = None
        self.scaler = None
        self.district_map = None
        self.landtype_map = None
        self.global_price_mean = 0
        
        # Load the models
        self.load_models()

    def load_models(self):
        """Loads the saved pickle files into memory."""
        try:
            self.model = joblib.load(self.model_dir / "isolation_forest_model.pkl")
            self.scaler = joblib.load(self.model_dir / "robust_scaler.pkl")
            self.district_map = joblib.load(self.model_dir / "district_target_map.pkl")
            self.landtype_map = joblib.load(self.model_dir / "landtype_target_map.pkl")
            self.global_price_mean = joblib.load(self.model_dir / "global_price_mean.pkl")
            
            print("AI Models loaded successfully for Anomaly Detection.")
        except Exception as e:
            print(f"Error loading AI models: {e}")

    def detect_anomaly(self, district: str, land_type: str, road_access: str, 
                      electricity: str, water: str, distance_to_town: float, 
                      price_per_perch: float):
        """
        Predicts if the land listing price is an anomaly given the features.
        """
        if self.model is None:
            return {"error": "Model not loaded"}

        # 1. Map Categorical Features
        dist_mean = self.district_map.get(district, self.global_price_mean)
        type_mean = self.landtype_map.get(land_type, self.global_price_mean)
        
        # 2. Convert Binary Features
        # Match mapping used in notebook: Yes/Available = 1, No/Not Available = 0
        road_acc = 1 if road_access.lower() in ["yes", "available"] else 0
        electr = 1 if electricity.lower() in ["yes", "available"] else 0
        wat = 1 if water.lower() in ["yes", "available"] else 0
        
        # 3. Feature Engineering: Price Ratio
        price_ratio = price_per_perch / (dist_mean + 1e-6)

        # 4. Create Feature Dataframe (Maintaining exact order from training)
        # Order: Road_Access, Electricity, Water, Distance_To_Town_km, District_Mean, Land_Type_Mean, Price_Per_Perch, Price_Ratio_To_District
        features = pd.DataFrame([{
            'Road_Access': road_acc,
            'Electricity': electr,
            'Water': wat,
            'Distance_To_Town_km': distance_to_town,
            'District_Mean': dist_mean,
            'Land_Type_Mean': type_mean,
            'Price_Per_Perch': price_per_perch,
            'Price_Ratio_To_District': price_ratio
        }])

        # 5. Scale the features (matching columns_to_scale from notebook)
        columns_to_scale = [
            "Distance_To_Town_km",
            "District_Mean",
            "Land_Type_Mean",
            "Price_Per_Perch",
            "Price_Ratio_To_District"
        ]
        
        features[columns_to_scale] = self.scaler.transform(features[columns_to_scale])

        # 6. Predict Anomaly
        # 1 = normal, -1 = anomaly
        prediction = self.model.predict(features)[0]
        score = self.model.decision_function(features)[0]

        # 7. Final practical check - only flag if price is significantly different (e.g. > 15%)
        # and model says -1.
        is_significant = False
        if dist_mean > 0:
            diff_percent = abs(price_per_perch - dist_mean) / dist_mean
            if diff_percent > 0.15: # 15% buffer
                is_significant = True

        final_is_anomaly = bool(prediction == -1 and is_significant)
        
        price_status = "normal"
        if final_is_anomaly:
            price_status = "high" if price_per_perch > dist_mean else "low"

        return {
            "is_anomaly": final_is_anomaly,
            "anomaly_score": float(score),
            "price_status": price_status,
            "district_average": float(dist_mean)
        }

# Singleton instance
anomaly_service = AnomalyDetectionService()
