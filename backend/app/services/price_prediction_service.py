import hashlib
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


class PricePredictionService:
    def __init__(self):
        self.model = None
        self.model_path = Path(__file__).resolve().parents[2] / "AI Part" / "Price_Prediction_Model.pkl"

        self.district_map = {
            "ampara": 1,
            "anuradhapura": 2,
            "badulla": 3,
            "batticaloa": 4,
            "colombo": 5,
            "galle": 6,
            "gampaha": 7,
            "hambantota": 8,
            "jaffna": 9,
            "kalutara": 10,
            "kandy": 11,
            "kegalle": 12,
            "kilinochchi": 13,
            "kurunegala": 14,
            "mannar": 15,
            "matale": 16,
            "matara": 17,
            "monaragala": 18,
            "mullaitivu": 19,
            "nuwara eliya": 20,
            "polonnaruwa": 21,
            "puttalam": 22,
            "ratnapura": 23,
            "trincomalee": 24,
            "vavuniya": 25,
        }

        self.land_type_map = {
            "residential": 0,
            "agricultural": 1,
            "commercial": 2,
            "mixed": 3,
        }

        self.load_model()

    def load_model(self):
        try:
            self.model = joblib.load(self.model_path)
            print("Price prediction model loaded successfully.")
        except Exception as e:
            self.model = None
            print(f"Error loading price prediction model: {e}")

    @staticmethod
    def _stable_hash(value: str, modulo: int = 10000) -> int:
        text = (value or "").strip().lower()
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % modulo

    @staticmethod
    def _road_access_to_binary(road_access: str) -> int:
        value = (road_access or "").strip().lower()
        if not value:
            return 0
        if any(token in value for token in ["no", "none", "not available", "without"]):
            return 0
        return 1

    def predict_price(
        self,
        district: str,
        village: str,
        perches: float,
        land_type: str,
        road_access: str,
        electricity: bool,
        water: bool,
        distance_to_town_km: float,
        distance_to_city_km: float,
        days_since_published: int,
        random_feature: float,
        listed_price_per_perch: float | None = None,
    ):
        if self.model is None:
            return {"error": "Price prediction model is not loaded"}

        district_key = (district or "").strip().lower()
        land_type_key = (land_type or "").strip().lower()

        district_encoded = self.district_map.get(district_key, self._stable_hash(district_key, 1000))
        village_encoded = self._stable_hash(village, 10000)
        land_type_encoded = self.land_type_map.get(land_type_key, 0)

        safe_perches = max(float(perches or 0), 0.01)
        safe_distance_town = max(float(distance_to_town_km or 0), 0.0)
        safe_distance_city = max(float(distance_to_city_km or 0), 0.0)
        safe_days = max(int(days_since_published or 0), 0)
        safe_random_feature = float(random_feature if random_feature is not None else 0.5)
        safe_listed_ppp = max(float(listed_price_per_perch), 0.0) if listed_price_per_perch is not None else 0.0

        features = pd.DataFrame([
            {
                "Price_Per_Perch": safe_listed_ppp,
                "Perches": safe_perches,
                "Village": village_encoded,
                "District": district_encoded,
                "Distance_To_Town_km": safe_distance_town,
                "Electricity": int(bool(electricity)),
                "distance_to_city": safe_distance_city,
                "Road_Access": self._road_access_to_binary(road_access),
                "Published_Date": safe_days,
                "Water": int(bool(water)),
                "random_feature": safe_random_feature,
                "Land_Type": land_type_encoded,
            }
        ])

        pred_total = float(self.model.predict(features)[0])
        pred_total = max(pred_total, 0.0)
        pred_per_perch = pred_total / safe_perches

        low_total = None
        high_total = None
        if hasattr(self.model, "estimators_") and self.model.estimators_:
            feature_matrix = features.to_numpy()
            tree_preds = np.array([est.predict(feature_matrix)[0] for est in self.model.estimators_], dtype=float)
            low_total = float(np.percentile(tree_preds, 10))
            high_total = float(np.percentile(tree_preds, 90))

        response = {
            "predicted_total_price": pred_total,
            "predicted_price_per_perch": pred_per_perch,
            "input_perches": safe_perches,
            "low_total_estimate": max(low_total, 0.0) if low_total is not None else None,
            "high_total_estimate": max(high_total, 0.0) if high_total is not None else None,
        }

        if listed_price_per_perch is not None:
            response["listed_price_per_perch"] = max(float(listed_price_per_perch), 0.0)
            response["listed_total_price"] = response["listed_price_per_perch"] * safe_perches
            response["per_perch_difference"] = response["listed_price_per_perch"] - pred_per_perch

        return response


price_prediction_service = PricePredictionService()