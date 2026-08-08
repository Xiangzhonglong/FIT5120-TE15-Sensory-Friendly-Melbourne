# Sensory-Friendly Melbourne — Data Pipeline Handoff

## Scope

This data pipeline prepares pedestrian observations, historical crowd baselines and public-place candidates for the Sensory-Friendly Melbourne application. It uses five official City of Melbourne open datasets:

1. [Pedestrian Counting System — Sensor Locations](https://data.melbourne.vic.gov.au/explore/dataset/pedestrian-counting-system-sensor-locations/)
2. [Pedestrian Counting System — Past Hour Counts per Minute](https://data.melbourne.vic.gov.au/explore/dataset/pedestrian-counting-system-past-hour-counts-per-minute/)
3. [Pedestrian Counting System — Counts per Hour](https://data.melbourne.vic.gov.au/explore/dataset/pedestrian-counting-system-monthly-counts-per-hour/)
4. [Landmarks and Places of Interest](https://data.melbourne.vic.gov.au/explore/dataset/landmarks-and-places-of-interest-including-schools-theatres-health-services-spor/)
5. [Business Establishments Location and Industry Classification](https://data.melbourne.vic.gov.au/explore/dataset/business-establishments-with-address-and-industry-classification/)

The fourth source provides named parks, gardens, reserves and civic squares. The fifth source provides current library names and coordinates. These records support candidate-place discovery.

## Run

```bash
python3 clean_data.py --mode sample
python3 clean_data.py --mode full --history-days 90
```

Sample mode validates the pipeline with limited live and historical records. Full mode produces the handoff datasets. The historical window is configurable.

## Outputs

| File | Purpose |
| --- | --- |
| `pedestrian_sensors.csv` | Sensor identifiers, status, labels and coordinates |
| `historical_counts_hourly.csv` | Validated hourly pedestrian counts for the selected history window |
| `quiet_space_candidates.csv` | Libraries, parks and public spaces with valid coordinates |
| `baseline.json` | Median and P95 by sensor, weekday and hour |
| `quiet-spaces-snapshot.json` | Versioned fallback snapshot of static place attributes |
| `pedestrian-sensors-snapshot.json` | Active sensor names and coordinates for packaged fallback matching |

`baseline.json` uses `sensors[sensorId][weekday][hour]`; weekday `0` is Monday. The quiet-space snapshot intentionally excludes `distanceM` because distance depends on the requested route or user location and must be calculated by the backend.

## Cleaning and quality controls

- Validate sensor identifiers, geographic coordinates, non-negative counts and hour ranges.
- Deduplicate sensor, live-minute and historical-hour records by their natural keys.
- Convert live timestamps to the Australia/Melbourne time zone.
- From Landmarks, first select records whose sub-theme is `Informal Outdoor Facility (Park/Garden/Reserve)`.
- Classify names containing the complete word `Park`, `Garden`, `Gardens` or `Domain` as `PARK`.
- Classify names containing the complete word `Reserve`, `Square`, `Piazza`, `Marr`, `Quay` or `Bridge` as `PUBLIC_SPACE`.
- Apply the same keyword rules to every record and exclude only records that match none of the supported place types.
- Correct `Murchinson Square` and `Shrine of Rembrance Reserve` to their standard spellings.
- Select the seven City of Melbourne public library branches and State Library Victoria, standardise their display names, and remove the duplicate North Melbourne property record.
- Treat missing live-minute observations as unknown rather than zero.

The console report separately counts unclear landmark types, out-of-scope library records, removed duplicates and rejected invalid records.

## Integration handoff

The three CSV files can initialise the corresponding RDS MySQL tables defined in `mysql_schema.sql`. Production ingestion should fetch the official past-hour API, apply `clean_live()`, aggregate minute observations into a comparable hourly `currentCount`, and upsert the result into RDS. The backend then maps the current count and the matching baseline P95 to its pedestrian domain model.

For nearby places, the backend reads the candidate coordinates, calculates route-relative distance, filters relevant results and adds `distanceM` before returning the shared `QuietSpace` API type. `baseline.json` and `quiet-spaces-snapshot.json` may also support versioned fallback behaviour; they do not replace the cloud relational database.

`clean_data.py` supplies reproducible retrieval, validation and transformation logic. The Vercel backend reads the cleaned outputs through Neon PostgreSQL and packaged snapshot providers, with logging, freshness checks and ordered fallback handling.

## Interpretation

- The analysis covers locations monitored by the City of Melbourne pedestrian sensor network.
- Crowd scores indicate relative pedestrian activity across monitored locations and time periods.
- Parks, libraries and public spaces are presented as candidate places for exploration.
- Baselines are calculated from the available valid historical observations for each sensor and time period.
