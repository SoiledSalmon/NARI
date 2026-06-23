"""
Context Feature Builder for ASSN.

All inputs are optional — safe defaults used if unavailable.
Never crashes regardless of what data is missing.

Feature vector (exact order — ORDER MATTERS for model):
  Index 0: hour_normalized        — time of day 0.0-1.0
  Index 1: day_risk               — weekday/weekend + hour risk 0.0-1.0
  Index 2: location_risk_score    — crime API score 0.0-1.0
  Index 3: user_baseline_hr_norm  — normalized resting HR 0.0-1.0
  Index 4: is_journey_mode        — 0.0 or 1.0
  Index 5: speed_normalized       — movement speed 0.0-1.0
"""

import math
import datetime
import requests
from functools import lru_cache


# ── Time-based risk lookup ─────────────────────────────────────────────────
# Based on UK ONS crime timing statistics
HOUR_RISK = {
    0: 0.9,  1: 0.95, 2: 1.0,  3: 0.95, 4: 0.7,
    5: 0.5,  6: 0.3,  7: 0.2,  8: 0.2,  9: 0.2,
    10: 0.2, 11: 0.2, 12: 0.25, 13: 0.25,
    14: 0.25, 15: 0.25, 16: 0.3, 17: 0.35,
    18: 0.4, 19: 0.5, 20: 0.6, 21: 0.7,
    22: 0.8, 23: 0.85
}


def compute_time_features(dt: datetime.datetime) -> tuple:
    """
    Returns (hour_normalized, day_risk) from a datetime.
    Falls back to neutral values if dt is invalid.
    """
    try:
        hour            = dt.hour
        hour_normalized = hour / 24.0
        is_weekend      = dt.weekday() >= 5
        base_risk       = HOUR_RISK.get(hour, 0.3)
        weekend_mod     = 1.15 if is_weekend and hour >= 20 else 1.0
        day_risk        = min(base_risk * weekend_mod, 1.0)
        return hour_normalized, day_risk
    except Exception:
        return 0.5, 0.3   # neutral midday fallback


@lru_cache(maxsize=512)
def _fetch_crime_score(lat_grid: float, lng_grid: float) -> float:
    """
    Internal cached crime API call.
    Uses OpenStreetMap Overpass API — works globally, no API key needed.
    Returns 0.5 on any failure.
    """
    try:
        overpass_url = "https://overpass-api.de/api/interpreter"
        query = f"""
        [out:json][timeout:3];
        (
          node["amenity"](around:500,{lat_grid},{lng_grid});
          node["shop"](around:500,{lat_grid},{lng_grid});
        );
        out count;
        """
        response = requests.post(overpass_url, data=query, timeout=1.5)
        if response.status_code != 200:
            return 0.5

        data  = response.json()
        count = data.get('elements', [{}])[0].get('tags', {}).get('total', 0)
        count = int(count) if count else 0

        # More amenities = more footfall = safer → invert for risk score
        footfall = min(count / 20.0, 1.0)
        return round(1.0 - footfall, 2)

    except Exception:
        return 0.5   # neutral on any failure


def get_location_risk(lat: float, lng: float) -> float:
    """
    Get crime-based risk score for a GPS location.
    Snaps to 0.01 degree grid for cache efficiency (~1km resolution).
    Returns 0.5 if lat/lng are None or API fails.
    """
    try:
        lat_grid = round(lat, 2)
        lng_grid = round(lng, 2)
        return _fetch_crime_score(lat_grid, lng_grid)
    except Exception:
        return 0.5


def haversine_distance(lat1, lng1, lat2, lng2) -> float:
    """Distance in metres between two GPS coordinates."""
    try:
        R    = 6371000
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lng2 - lng1)
        a    = (math.sin(dphi/2)**2 +
                math.cos(phi1) * math.cos(phi2) * math.sin(dlam/2)**2)
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    except Exception:
        return 0.0


def compute_speed(lat1, lng1, lat2, lng2,
                  time_delta_seconds: float) -> float:
    """Speed in km/h from two GPS readings. Returns 0.0 on failure."""
    try:
        if time_delta_seconds <= 0:
            return 0.0
        dist_m   = haversine_distance(lat1, lng1, lat2, lng2)
        speed_ms = dist_m / time_delta_seconds
        return speed_ms * 3.6
    except Exception:
        return 0.0


def build_context_vector(
    lat:               float = None,
    lng:               float = None,
    dt:                datetime.datetime = None,
    user_baseline_hr:  float = None,
    is_journey_mode:   bool  = None,
    speed_kmh:         float = None,
    prev_lat:          float = None,
    prev_lng:          float = None,
    prev_time_seconds: float = None,
) -> list:
    """
    Build the 6-feature context vector for the Dense branch.

    ALL inputs are optional — safe defaults used if unavailable.
    Never crashes regardless of what data is missing.

    Defaults when data unavailable:
      GPS missing       → location_risk = 0.5 (neutral)
      API fails         → location_risk = 0.5 (neutral)
      time missing      → use system clock
      HR missing        → 68bpm (WESAD population mean)
      journey missing   → False
      speed missing     → 0.0 (stationary)

    Returns:
        list of 6 floats, all in [0.0, 1.0]
        ORDER: [hour_norm, day_risk, location_risk,
                hr_norm, journey, speed_norm]
    """

    # ── Feature 0 + 1: time ───────────────────────────────────
    try:
        if dt is None:
            dt = datetime.datetime.now()
        hour_norm, day_risk = compute_time_features(dt)
    except Exception:
        hour_norm = 0.5
        day_risk  = 0.3

    # ── Feature 2: location risk ──────────────────────────────
    try:
        if lat is not None and lng is not None:
            location_risk = get_location_risk(lat, lng)
        else:
            location_risk = 0.5   # no GPS available
    except Exception:
        location_risk = 0.5

    # ── Feature 3: HR baseline ────────────────────────────────
    try:
        if user_baseline_hr is None:
            user_baseline_hr = 68.0   # WESAD population mean
        hr_norm = (user_baseline_hr - 40.0) / 60.0
        hr_norm = max(0.0, min(1.0, hr_norm))
    except Exception:
        hr_norm = 0.47   # 68bpm normalized

    # ── Feature 4: journey mode ───────────────────────────────
    try:
        journey = 1.0 if is_journey_mode else 0.0
    except Exception:
        journey = 0.0

    # ── Feature 5: speed ──────────────────────────────────────
    try:
        if speed_kmh is None:
            if (prev_lat is not None and prev_lng is not None
                    and lat is not None and lng is not None
                    and prev_time_seconds and prev_time_seconds > 0):
                speed_kmh = compute_speed(
                    prev_lat, prev_lng, lat, lng, prev_time_seconds
                )
            else:
                speed_kmh = 0.0
        speed_norm = min(speed_kmh / 30.0, 1.0)
    except Exception:
        speed_norm = 0.0

    return [
        round(hour_norm,     4),
        round(day_risk,      4),
        round(location_risk, 4),
        round(hr_norm,       4),
        round(journey,       4),
        round(speed_norm,    4),
    ]
