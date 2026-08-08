#!/usr/bin/env python3
"""Download and clean five selected official open datasets.

Uses Python's standard library only. Outputs are suitable for local inspection,
RDS/MySQL loading, and reuse by a future AWS Lambda adapter.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import re
import statistics
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

BASE = "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets"
MELBOURNE = ZoneInfo("Australia/Melbourne")
DATASETS = {
    "sensors": "pedestrian-counting-system-sensor-locations",
    "live": "pedestrian-counting-system-past-hour-counts-per-minute",
    "history": "pedestrian-counting-system-monthly-counts-per-hour",
    "places": "landmarks-and-places-of-interest-including-schools-theatres-health-services-spor",
    "libraries": "business-establishments-with-address-and-industry-classification",
}


def read_url(req: Request, *, timeouts: tuple[int, ...]) -> bytes:
    last_error = None
    for attempt, timeout in enumerate(timeouts):
        try:
            with urlopen(req, timeout=timeout) as response:
                return response.read()
        except HTTPError as exc:
            if exc.code not in {429, 500, 502, 503, 504}:
                raise
            last_error = exc
        except (TimeoutError, URLError) as exc:
            last_error = exc
        if attempt < len(timeouts) - 1:
            time.sleep(2 ** attempt)
    raise RuntimeError(f"download failed after {len(timeouts)} attempts: {last_error}")


def read_json_url(req: Request, *, timeouts: tuple[int, ...] = (60, 90, 120)):
    return json.loads(read_url(req, timeouts=timeouts).decode("utf-8"))


def api_records(
    dataset: str,
    *,
    where: str | None = None,
    order_by: str | None = None,
    max_records: int | None = None,
):
    offset, page_size = 0, 100
    while True:
        params = {"limit": page_size, "offset": offset}
        if where:
            params["where"] = where
        if order_by:
            params["order_by"] = order_by
        url = f"{BASE}/{dataset}/records?{urlencode(params)}"
        req = Request(url, headers={"User-Agent": "FIT5120-sensory-data-pipeline/1.0"})
        payload = read_json_url(req)
        rows = payload.get("results", [])
        if max_records is not None:
            rows = rows[: max(0, max_records - offset)]
        yield from rows
        offset += len(rows)
        if not rows or offset >= payload.get("total_count", offset) or (
            max_records is not None and offset >= max_records
        ):
            break


def api_latest_datetime(dataset: str, field: str) -> datetime:
    params = {"select": f"max({field}) as latest", "limit": 1}
    url = f"{BASE}/{dataset}/records?{urlencode(params)}"
    req = Request(url, headers={"User-Agent": "FIT5120-sensory-data-pipeline/1.0"})
    payload = read_json_url(req)
    value = payload["results"][0]["latest"]
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def api_max_value(dataset: str, field: str):
    params = {"select": f"max({field}) as latest", "limit": 1}
    url = f"{BASE}/{dataset}/records?{urlencode(params)}"
    req = Request(url, headers={"User-Agent": "FIT5120-sensory-data-pipeline/1.0"})
    payload = read_json_url(req)
    return payload["results"][0]["latest"]


def api_export_csv(dataset: str, *, where: str | None = None) -> list[dict]:
    """Use the export endpoint instead of exceeding the records API offset limit."""
    params = {}
    if where:
        params["where"] = where
    url = f"{BASE}/{dataset}/exports/csv"
    if params:
        url += "?" + urlencode(params)
    req = Request(url, headers={"User-Agent": "FIT5120-sensory-data-pipeline/1.0"})
    text = read_url(req, timeouts=(180, 300, 420)).decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text), delimiter=";"))


def finite_number(value, field: str) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise ValueError(f"{field} is not finite")
    return number


def integer(value, field: str) -> int:
    number = int(value)
    if number < 0:
        raise ValueError(f"{field} is negative")
    return number


def iso_melbourne(value: str) -> str:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(MELBOURNE).isoformat()


def write_csv(path: Path, rows: list[dict], fields: list[str]):
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def clean_sensors(raw: list[dict], rejected: list[dict]) -> list[dict]:
    output, seen = [], set()
    for row in raw:
        try:
            location_id = integer(row["location_id"], "location_id")
            lat = finite_number(row.get("latitude") or row["location"]["lat"], "latitude")
            lng = finite_number(row.get("longitude") or row["location"]["lon"], "longitude")
            if not (-38.2 <= lat <= -37.4 and 144.4 <= lng <= 145.5):
                raise ValueError("coordinates outside greater Melbourne sanity bounds")
            if location_id in seen:
                raise ValueError("duplicate location_id")
            seen.add(location_id)
            output.append({
                "location_id": location_id,
                "sensor_name": (row.get("sensor_name") or "").strip(),
                "sensor_description": (row.get("sensor_description") or "").strip(),
                "status": (row.get("status") or "").strip().upper(),
                "location_type": (row.get("location_type") or "").strip(),
                "direction_1_label": (row.get("direction_1") or "").strip(),
                "direction_2_label": (row.get("direction_2") or "").strip(),
                "latitude": round(lat, 8),
                "longitude": round(lng, 8),
                "installation_date": row.get("installation_date"),
                "source_note": row.get("note"),
            })
        except Exception as exc:
            rejected.append({"dataset": "sensors", "reason": str(exc), "record": row})
    return output


def clean_live(raw: list[dict], valid_ids: set[int], rejected: list[dict]) -> list[dict]:
    # Official notes identify old duplicate risks; deduplicate all records by
    # location + timestamp rather than hard-coding sensor IDs.
    best: dict[tuple[int, str], dict] = {}
    for row in raw:
        try:
            location_id = integer(row["location_id"], "location_id")
            if location_id not in valid_ids:
                raise ValueError("unknown location_id")
            observed_at = iso_melbourne(row["sensing_datetime"])
            d1 = integer(row.get("direction_1", 0), "direction_1")
            d2 = integer(row.get("direction_2", 0), "direction_2")
            total = integer(row.get("total_of_directions", d1 + d2), "total")
            if total != d1 + d2:
                raise ValueError("total does not equal direction_1 + direction_2")
            candidate = {
                "location_id": location_id,
                "observed_at": observed_at,
                "direction_1_count": d1,
                "direction_2_count": d2,
                "pedestrian_count": total,
            }
            key = (location_id, observed_at)
            if key not in best or total > best[key]["pedestrian_count"]:
                best[key] = candidate
        except Exception as exc:
            rejected.append({"dataset": "live", "reason": str(exc), "record": row})
    return sorted(best.values(), key=lambda x: (x["observed_at"], x["location_id"]))


def aggregate_live_hourly(rows: list[dict]) -> list[dict]:
    grouped = defaultdict(lambda: {"direction_1_count": 0, "direction_2_count": 0, "pedestrian_count": 0, "minute_records": 0})
    for row in rows:
        dt = datetime.fromisoformat(row["observed_at"])
        hour = dt.replace(minute=0, second=0, microsecond=0).isoformat()
        key = (row["location_id"], hour)
        grouped[key]["direction_1_count"] += row["direction_1_count"]
        grouped[key]["direction_2_count"] += row["direction_2_count"]
        grouped[key]["pedestrian_count"] += row["pedestrian_count"]
        grouped[key]["minute_records"] += 1
    return [
        {"location_id": key[0], "hour_start": key[1], **values}
        for key, values in sorted(grouped.items())
    ]


def clean_history(raw: list[dict], valid_ids: set[int], rejected: list[dict]) -> list[dict]:
    best = {}
    for row in raw:
        try:
            location_id = integer(row["location_id"], "location_id")
            if location_id not in valid_ids:
                raise ValueError("unknown location_id")
            hour = integer(row["hourday"], "hourday")
            if hour > 23:
                raise ValueError("hourday outside 0..23")
            date = str(row["sensing_date"])[:10]
            count = integer(row["pedestriancount"], "pedestriancount")
            key = (location_id, date, hour)
            candidate = {
                "location_id": location_id,
                "sensing_date": date,
                "hour_of_day": hour,
                "pedestrian_count": count,
                "sensor_name": (row.get("sensor_name") or "").strip(),
            }
            if key not in best or count > best[key]["pedestrian_count"]:
                best[key] = candidate
        except Exception as exc:
            rejected.append({"dataset": "history", "reason": str(exc), "record": row})
    return sorted(best.values(), key=lambda x: (x["sensing_date"], x["hour_of_day"], x["location_id"]))


def percentile_nearest_rank(values: list[int], percentile: float) -> int:
    ordered = sorted(values)
    index = max(0, math.ceil(percentile * len(ordered)) - 1)
    return ordered[index]


def build_baseline(rows: list[dict]) -> dict:
    grouped = defaultdict(list)
    for row in rows:
        weekday = datetime.fromisoformat(row["sensing_date"]).weekday()
        grouped[(row["location_id"], weekday, row["hour_of_day"])].append(row["pedestrian_count"])
    sensors: dict[str, dict[str, dict[str, dict]]] = {}
    for (location_id, weekday, hour), values in sorted(grouped.items()):
        sensor = sensors.setdefault(str(location_id), {})
        day = sensor.setdefault(str(weekday), {})
        day[str(hour)] = {
            "median": round(statistics.median(values), 2),
            "p95": percentile_nearest_rank(values, 0.95),
            "sampleSize": len(values),
        }
    return {
        "schemaVersion": 1,
        "generatedAt": datetime.now(MELBOURNE).isoformat(),
        "source": "City of Melbourne pedestrian counts per hour",
        "sourceDatasetId": DATASETS["history"],
        "weekdayConvention": "0=Monday, 6=Sunday",
        "sensors": sensors,
    }


def stable_id(name: str, place_type: str, lat: float, lng: float) -> str:
    digest = hashlib.sha256(
        f"{name}|{place_type}|{lat:.6f}|{lng:.6f}".encode()
    ).hexdigest()[:12]
    return f"quiet-{digest}"


PLACE_NAME_CORRECTIONS = {
    "Murchinson Square": "Murchison Square",
    "Shrine of Rembrance Reserve": "Shrine of Remembrance Reserve",
}

LIBRARY_NAMES = {
    "city library": "City Library",
    "east melbourne library": "East Melbourne Library",
    "kathleen syme library and community centre": "Kathleen Syme Library and Community Centre",
    "library at the dock": "Library at the Dock",
    "narrm ngarrgu library and family services centre": "narrm ngarrgu Library and Family Services",
    "north melbourne library": "North Melbourne Library",
    "southbank library at boyd": "Southbank Library",
    "library board of victoria": "State Library Victoria",
}

def classify_landmark(name: str) -> str | None:
    """Map landmark names with one consistent, auditable keyword rule."""
    words = {word.casefold() for word in re.findall(r"[A-Za-z]+", name)}
    if words & {"park", "garden", "gardens", "domain"}:
        return "PARK"
    if words & {"reserve", "square", "piazza", "marr", "quay", "bridge"}:
        return "PUBLIC_SPACE"
    return None


def clean_landmarks(
    raw: list[dict],
    rejected: list[dict],
    quality: dict[str, int],
) -> list[dict]:
    output = []
    for row in raw:
        original_name = (row.get("feature_name") or "").strip()
        name = PLACE_NAME_CORRECTIONS.get(original_name, original_name)
        place_type = classify_landmark(name)
        if place_type is None:
            quality["placesExcludedUnclearType"] += 1
            continue
        try:
            point = row.get("co_ordinates") or {}
            lat = finite_number(point["lat"], "latitude")
            lng = finite_number(point["lon"], "longitude")
            if not (-38.2 <= lat <= -37.4 and 144.4 <= lng <= 145.5):
                raise ValueError("coordinates outside greater Melbourne sanity bounds")
            output.append({
                "id": stable_id(name, place_type, lat, lng),
                "name": name,
                "type": place_type,
                "latitude": round(lat, 8),
                "longitude": round(lng, 8),
                "source_dataset_id": DATASETS["places"],
                "source_category": (row.get("sub_theme") or "").strip(),
                "source_record_name": original_name,
                "source_label": "City of Melbourne Open Data",
            })
        except Exception as exc:
            rejected.append({"dataset": "places", "reason": str(exc), "record": row})
    return output


def clean_libraries(
    raw: list[dict],
    rejected: list[dict],
    quality: dict[str, int],
) -> list[dict]:
    preferred: dict[str, dict] = {}
    for row in raw:
        raw_name = (row.get("trading_name") or "").strip()
        name = LIBRARY_NAMES.get(raw_name.casefold())
        if name is None:
            quality["librariesExcludedOutsideScope"] += 1
            continue
        try:
            lat = finite_number(row["latitude"], "latitude")
            lng = finite_number(row["longitude"], "longitude")
            if not (-38.2 <= lat <= -37.4 and 144.4 <= lng <= 145.5):
                raise ValueError("coordinates outside greater Melbourne sanity bounds")
            candidate = {
                "id": stable_id(name, "LIBRARY", lat, lng),
                "name": name,
                "type": "LIBRARY",
                "latitude": round(lat, 8),
                "longitude": round(lng, 8),
                "source_dataset_id": DATASETS["libraries"],
                "source_category": (row.get("industry_anzsic4_description") or "").strip(),
                "source_record_name": raw_name,
                "source_label": "City of Melbourne Open Data",
                "_raw_address": (row.get("business_address") or "").strip(),
            }
            current = preferred.get(name)
            # Prefer the primary record over duplicate records labelled "Part".
            if current is None or (
                current["_raw_address"].casefold().startswith("part ")
                and not candidate["_raw_address"].casefold().startswith("part ")
            ):
                preferred[name] = candidate
        except Exception as exc:
            rejected.append({"dataset": "libraries", "reason": str(exc), "record": row})
    quality["libraryDuplicatesRemoved"] = len(raw) - quality["librariesExcludedOutsideScope"] - len(preferred)
    output = []
    for row in preferred.values():
        row.pop("_raw_address", None)
        output.append(row)
    return output


def clean_quiet(
    landmark_rows: list[dict],
    library_rows: list[dict],
    rejected: list[dict],
    quality: dict[str, int],
) -> list[dict]:
    combined = clean_landmarks(landmark_rows, rejected, quality)
    combined.extend(clean_libraries(library_rows, rejected, quality))
    unique = {}
    for row in combined:
        key = (row["name"].casefold(), row["type"])
        if key not in unique:
            unique[key] = row
    return sorted(unique.values(), key=lambda x: (x["type"], x["name"].casefold()))


def build_quiet_snapshot(rows: list[dict]) -> dict:
    return {
        "schemaVersion": 1,
        "generatedAt": datetime.now(MELBOURNE).isoformat(),
        "source": "City of Melbourne Open Data",
        "sourceDatasetIds": [DATASETS["places"], DATASETS["libraries"]],
        "status": "generated-open-data-candidates",
        "features": [
            {
                "id": row["id"],
                "name": row["name"],
                "type": row["type"],
                "location": {
                    "lat": row["latitude"],
                    "lng": row["longitude"],
                },
                "sourceLabel": row["source_label"],
            }
            for row in rows
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="cleaned_output")
    parser.add_argument("--mode", choices=["sample", "full"], default="sample")
    parser.add_argument("--history-days", type=int, default=90)
    args = parser.parse_args()
    if args.history_days <= 0:
        parser.error("--history-days must be greater than zero")
    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)
    limit = 500 if args.mode == "sample" else None
    rejected: list[dict] = []
    quality = {
        "placesExcludedUnclearType": 0,
        "librariesExcludedOutsideScope": 0,
        "libraryDuplicatesRemoved": 0,
    }

    raw_sensors = list(api_records(DATASETS["sensors"]))
    sensors = clean_sensors(raw_sensors, rejected)
    valid_ids = {r["location_id"] for r in sensors}
    latest_live = api_latest_datetime(DATASETS["live"], "sensing_datetime")
    live_start = (latest_live - timedelta(hours=2)).isoformat()
    live_where = f"sensing_datetime >= date'{live_start}'"
    raw_live = list(api_records(
        DATASETS["live"],
        where=live_where,
        order_by="sensing_datetime desc",
        max_records=limit,
    ))
    live = clean_live(
        raw_live,
        valid_ids,
        rejected,
    )
    cutoff = (datetime.now(MELBOURNE).date() - timedelta(days=args.history_days)).isoformat()
    history_where = f"sensing_date >= date'{cutoff}'"
    raw_history = (
        list(api_records(
            DATASETS["history"],
            where=history_where,
            order_by="sensing_date desc, hourday desc",
            max_records=limit,
        ))
        if args.mode == "sample"
        else api_export_csv(DATASETS["history"], where=history_where)
    )
    history = clean_history(
        raw_history,
        valid_ids,
        rejected,
    )
    raw_places = list(api_records(
        DATASETS["places"],
        where='sub_theme="Informal Outdoor Facility (Park/Garden/Reserve)"',
    ))
    latest_library_year = int(str(api_max_value(DATASETS["libraries"], "census_year"))[:4])
    raw_libraries = list(api_records(
        DATASETS["libraries"],
        where=(
            f"year(census_year)={latest_library_year} AND "
            '(search(trading_name,"Library") OR search(trading_name,"Narrm Ngarrgu"))'
        ),
    ))
    quiet = clean_quiet(raw_places, raw_libraries, rejected, quality)

    write_csv(out / "pedestrian_sensors.csv", sensors, list(sensors[0]) if sensors else [])
    write_csv(out / "historical_counts_hourly.csv", history, list(history[0]) if history else [])
    write_csv(out / "quiet_space_candidates.csv", quiet, list(quiet[0]) if quiet else [])
    (out / "baseline.json").write_text(
        json.dumps(build_baseline(history), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (out / "quiet-spaces-snapshot.json").write_text(
        json.dumps(build_quiet_snapshot(quiet), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    report = {
        "generatedAt": datetime.now(MELBOURNE).isoformat(),
        "mode": args.mode,
        "historyDaysRequested": args.history_days,
        "counts": {
            "sensors": len(sensors), "liveMinute": len(live),
            "historicalHourly": len(history),
            "quietCandidates": len(quiet),
            **quality,
            "rejected": len(rejected),
        },
        "latestLiveObservedAt": max((r["observed_at"] for r in live), default=None),
        "warnings": [
            "Missing live minute records are unknown, not zero.",
        ] + (
            ["Sample mode truncates live/history downloads and is for pipeline testing only."]
            if args.mode == "sample"
            else []
        ),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
