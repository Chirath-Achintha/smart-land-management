import hashlib
from pathlib import Path

import joblib
import numpy as np
import pandas as pd


class PricePredictionService:
    ROAD_ACCESS_MIN_UPLIFT = 0.02
    PPP_STABILITY_BASE_PERCHES = 8.0
    WATER_AVAILABLE_MULTIPLIER = 1.035
    WATER_UNAVAILABLE_MULTIPLIER = 0.955
    DISTANCE_TO_TOWN_DECAY_PER_KM = 0.012
    DISTANCE_TO_TOWN_FLOOR_MULTIPLIER = 0.78
    VILLAGE_EFFECT_MIN = 0.94
    VILLAGE_EFFECT_MAX = 1.06

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

    @classmethod
    def _distance_to_town_multiplier(cls, distance_km: float) -> float:
        distance = max(float(distance_km or 0.0), 0.0)
        return max(cls.DISTANCE_TO_TOWN_FLOOR_MULTIPLIER, 1.0 - (distance * cls.DISTANCE_TO_TOWN_DECAY_PER_KM))

    @classmethod
    def _water_multiplier(cls, has_water: bool) -> float:
        return cls.WATER_AVAILABLE_MULTIPLIER if bool(has_water) else cls.WATER_UNAVAILABLE_MULTIPLIER

    @classmethod
    def _village_multiplier(cls, village: str) -> float:
        normalized = (village or "").strip().lower()
        if not normalized:
            return 1.0

        # Keep village effect deterministic but bounded to avoid unstable jumps.
        bucket = cls._stable_hash(normalized, 1000) / 999.0
        base = cls.VILLAGE_EFFECT_MIN + (cls.VILLAGE_EFFECT_MAX - cls.VILLAGE_EFFECT_MIN) * bucket

        premium_tokens = ("city", "town", "central", "fort", "junction")
        if any(token in normalized for token in premium_tokens):
            base += 0.01

        return min(max(base, cls.VILLAGE_EFFECT_MIN), cls.VILLAGE_EFFECT_MAX)

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
        road_access_binary = self._road_access_to_binary(road_access)

        def build_features(perch_value: float, road_value: int) -> pd.DataFrame:
            return pd.DataFrame([
                {
                    "Price_Per_Perch": safe_listed_ppp,
                    "Perches": float(perch_value),
                    "Village": village_encoded,
                    "District": district_encoded,
                    "Distance_To_Town_km": safe_distance_town,
                    "Electricity": int(bool(electricity)),
                    "distance_to_city": safe_distance_city,
                    "Road_Access": int(road_value),
                    "Published_Date": safe_days,
                    "Water": int(bool(water)),
                    "random_feature": safe_random_feature,
                    "Land_Type": land_type_encoded,
                }
            ])

        # Primary prediction uses the exact user perch count.
        actual_features = build_features(safe_perches, road_access_binary)
        pred_total_actual = max(float(self.model.predict(actual_features)[0]), 0.0)
        pred_ppp_actual = pred_total_actual / safe_perches

        # Stability anchor from a typical lot size prevents inflated unit prices
        # on tiny plots while still using the same AI model.
        stability_perches = max(safe_perches, self.PPP_STABILITY_BASE_PERCHES)
        stability_features = build_features(stability_perches, road_access_binary)
        pred_total_stability = max(float(self.model.predict(stability_features)[0]), 0.0)
        pred_ppp_stability = pred_total_stability / stability_perches

        if safe_perches < self.PPP_STABILITY_BASE_PERCHES:
            pred_per_perch = min(pred_ppp_actual, pred_ppp_stability)
            ppp_basis_features = stability_features
            ppp_basis_perches = stability_perches
        else:
            pred_per_perch = pred_ppp_actual
            ppp_basis_features = actual_features
            ppp_basis_perches = safe_perches

        if road_access_binary == 1:
            # Business guardrail: road access must not reduce estimated value.
            without_road_features = build_features(ppp_basis_perches, 0)
            without_road_total = max(float(self.model.predict(without_road_features)[0]), 0.0)
            without_road_ppp = without_road_total / ppp_basis_perches
            required_min_ppp = without_road_ppp * (1 + self.ROAD_ACCESS_MIN_UPLIFT)
            pred_per_perch = max(pred_per_perch, required_min_ppp)

        # Enforce meaningful impact from user-selected locality and utility fields.
        water_multiplier = self._water_multiplier(water)
        distance_multiplier = self._distance_to_town_multiplier(safe_distance_town)
        village_multiplier = self._village_multiplier(village)
        combined_multiplier = water_multiplier * distance_multiplier * village_multiplier

        pred_per_perch *= combined_multiplier

        pred_total = pred_per_perch * safe_perches

        low_total = None
        high_total = None
        if hasattr(self.model, "estimators_") and self.model.estimators_:
            feature_matrix = ppp_basis_features.to_numpy()
            tree_preds = np.array([est.predict(feature_matrix)[0] for est in self.model.estimators_], dtype=float)
            low_ppp = float(np.percentile(tree_preds, 10))
            high_ppp = float(np.percentile(tree_preds, 90))
            low_ppp = max(low_ppp / ppp_basis_perches, 0.0)
            high_ppp = max(high_ppp / ppp_basis_perches, 0.0)
            low_ppp *= combined_multiplier
            high_ppp *= combined_multiplier
            low_total = low_ppp * safe_perches
            high_total = high_ppp * safe_perches
            if road_access_binary == 1:
                high_total = max(high_total, pred_total)

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