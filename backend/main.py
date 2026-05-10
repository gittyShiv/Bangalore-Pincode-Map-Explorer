from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT_DIR / "pincodes.json"


class AreaRecord(BaseModel):
    pincode: str
    area: str
    corporation: str
    lat: float
    lng: float


app = FastAPI(title="Bangalore Pincode Map Explorer", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_records() -> list[AreaRecord]:
    if not DATA_FILE.exists():
        raise RuntimeError(f"Dataset file not found: {DATA_FILE}")
    raw_items = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return [AreaRecord(**item) for item in raw_items]


RECORDS = load_records()


def normalize(value: str) -> str:
    return value.strip().casefold()


def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    earth_radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    start_lat = math.radians(lat1)
    end_lat = math.radians(lat2)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(start_lat) * math.cos(end_lat) * math.sin(d_lng / 2) ** 2
    )
    return earth_radius_km * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def serialize(record: AreaRecord, distance_km: float | None = None) -> dict[str, Any]:
    payload = record.dict()
    if distance_km is not None:
        payload["distance_km"] = round(distance_km, 2)
    return payload


def overview() -> dict[str, Any]:
    corporations: dict[str, dict[str, Any]] = {}
    for record in RECORDS:
        entry = corporations.setdefault(
            record.corporation,
            {"corporation": record.corporation, "count": 0, "areas": set(), "pincodes": set()},
        )
        entry["count"] += 1
        entry["areas"].add(record.area)
        entry["pincodes"].add(record.pincode)

    corporation_rows = [
        {
            "corporation": item["corporation"],
            "count": item["count"],
            "areaCount": len(item["areas"]),
            "pincodeCount": len(item["pincodes"]),
        }
        for item in corporations.values()
    ]
    corporation_rows.sort(key=lambda row: row["corporation"])
    return {
        "totalRecords": len(RECORDS),
        "uniqueAreas": len({record.area for record in RECORDS}),
        "uniquePincodes": len({record.pincode for record in RECORDS}),
        "corporations": corporation_rows,
    }


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/areas")
def get_areas() -> dict[str, Any]:
    return {"overview": overview(), "areas": [serialize(record) for record in RECORDS]}


@app.get("/api/lookup")
def lookup(
    pincode: str | None = None,
    area: str | None = None,
) -> dict[str, Any]:
    if pincode and area:
        raise HTTPException(status_code=400, detail="Provide either pincode or area, not both")
    if not pincode and not area:
        raise HTTPException(status_code=400, detail="Provide a pincode or area query")

    if pincode:
        query = pincode.strip()
        matches = [record for record in RECORDS if record.pincode == query]
        if not matches:
            raise HTTPException(status_code=404, detail=f"No areas found for pincode {query}")
        return {
            "query": query,
            "matchType": "pincode",
            "total": len(matches),
            "matches": [serialize(record) for record in matches],
        }

    query = area.strip()
    normalized_query = normalize(query)
    exact_matches = [record for record in RECORDS if normalize(record.area) == normalized_query]
    partial_matches = [record for record in RECORDS if normalized_query in normalize(record.area)]
    matches = exact_matches or partial_matches

    if not matches:
        raise HTTPException(status_code=404, detail=f"No pincodes found for area {query}")

    return {
        "query": query,
        "matchType": "area",
        "total": len(matches),
        "matches": [serialize(record) for record in matches],
    }


@app.get("/api/nearest")
def nearest(lat: float, lng: float) -> dict[str, Any]:
    if not RECORDS:
        raise HTTPException(status_code=503, detail="Dataset unavailable")

    closest_record = min(
        RECORDS,
        key=lambda record: haversine_distance_km(lat, lng, record.lat, record.lng),
    )
    distance_km = haversine_distance_km(lat, lng, closest_record.lat, closest_record.lng)
    return {"query": {"lat": lat, "lng": lng}, "match": serialize(closest_record, distance_km)}
