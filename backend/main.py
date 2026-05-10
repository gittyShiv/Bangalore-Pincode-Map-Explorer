from __future__ import annotations

import math
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


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

RAW_RECORDS: list[dict[str, Any]] = [
    {"pincode": "560001", "area": "Cubbon Park", "corporation": "Bengaluru Central", "lat": 12.9763, "lng": 77.5929},
    {"pincode": "560002", "area": "Chickpet", "corporation": "Bengaluru Central", "lat": 12.9677, "lng": 77.5773},
    {"pincode": "560004", "area": "Shivaji Nagar", "corporation": "Bengaluru Central", "lat": 12.9833, "lng": 77.6},
    {"pincode": "560009", "area": "Gandhi Nagar", "corporation": "Bengaluru Central", "lat": 12.98, "lng": 77.5757},
    {"pincode": "560010", "area": "Shanti Nagar", "corporation": "Bengaluru Central", "lat": 12.9573, "lng": 77.5986},
    {"pincode": "560034", "area": "Koramangala", "corporation": "Bengaluru South", "lat": 12.9352, "lng": 77.6245},
    {"pincode": "560029", "area": "Jayanagar", "corporation": "Bengaluru South", "lat": 12.9252, "lng": 77.5938},
    {"pincode": "560076", "area": "BTM Layout", "corporation": "Bengaluru South", "lat": 12.9166, "lng": 77.6101},
    {"pincode": "560068", "area": "Bommanahalli", "corporation": "Bengaluru South", "lat": 12.8996, "lng": 77.6396},
    {"pincode": "560100", "area": "Electronic City", "corporation": "Bengaluru South", "lat": 12.8399, "lng": 77.677},
    {"pincode": "560037", "area": "Indiranagar", "corporation": "Bengaluru East", "lat": 12.9784, "lng": 77.6408},
    {"pincode": "560048", "area": "Mahadevapura", "corporation": "Bengaluru East", "lat": 12.9946, "lng": 77.6972},
    {"pincode": "560036", "area": "KR Puram", "corporation": "Bengaluru East", "lat": 13.0072, "lng": 77.6936},
    {"pincode": "560066", "area": "Whitefield", "corporation": "Bengaluru East", "lat": 12.9698, "lng": 77.7499},
    {"pincode": "560037", "area": "Marathahalli", "corporation": "Bengaluru East", "lat": 12.9591, "lng": 77.6974},
    {"pincode": "560010", "area": "Rajajinagar", "corporation": "Bengaluru West", "lat": 12.9916, "lng": 77.5539},
    {"pincode": "560040", "area": "Vijayanagar", "corporation": "Bengaluru West", "lat": 12.9719, "lng": 77.5355},
    {"pincode": "560004", "area": "Basavanagudi", "corporation": "Bengaluru West", "lat": 12.9429, "lng": 77.5745},
    {"pincode": "560022", "area": "Yeshwanthpur", "corporation": "Bengaluru West", "lat": 13.0235, "lng": 77.539},
    {"pincode": "560055", "area": "Nagarbhavi", "corporation": "Bengaluru West", "lat": 12.9633, "lng": 77.51},
    {"pincode": "560064", "area": "Yelahanka", "corporation": "Bengaluru North", "lat": 13.1007, "lng": 77.5963},
    {"pincode": "560024", "area": "Hebbal", "corporation": "Bengaluru North", "lat": 13.0352, "lng": 77.597},
    {"pincode": "560026", "area": "Byatarayanapura", "corporation": "Bengaluru North", "lat": 13.0563, "lng": 77.564},
    {"pincode": "560063", "area": "Devanahalli", "corporation": "Bengaluru North", "lat": 13.2479, "lng": 77.7119},
    {"pincode": "560092", "area": "Thanisandra", "corporation": "Bengaluru North", "lat": 13.0598, "lng": 77.6309},
]


RECORDS = [AreaRecord(**item) for item in RAW_RECORDS]


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
