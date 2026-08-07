# Sensory-Friendly Melbourne project overview

## Product goal

The project provides a no-login walking route comparison tool for sensory-sensitive adults travelling through Melbourne CBD. It does not simply recommend the shortest route. It combines candidate walking routes with nearby pedestrian data to produce explainable crowd-load levels, tolerance-based warnings, calmer alternatives and nearby public places that may offer a lower-stimulation pause.

## Epic 1: sensory-aware route planning and navigation

- A user selects a destination inside Melbourne CBD.
- The system returns at least one walking route and evaluates it using open pedestrian data.
- Every route displays LOW, MODERATE or HIGH using text and non-colour indicators.
- When a route exceeds the user's threshold, the system warns the user and recommends a calmer alternative.
- Public transport access points near candidate routes are included in the response boundary.

## Epic 2: sensory environment monitoring

- The system shows alerts for high-density pedestrian areas.
- It presents nearby parks, libraries and other quiet-space candidates on demand.
- It provides a transparent next-hour alert based on historical hourly patterns and recent conditions.
- Every prediction identifies its time and confidence and is described as a possibility, not a certainty.

## Locked MVP scope

The MVP must include:

- a public AWS HTTPS URL;
- no registration, login, user account or database;
- destination selection and candidate walking routes;
- explainable scoring based on pedestrian data;
- LOW, MODERATE and HIGH textual levels;
- a user threshold, crowd warning and alternative route;
- current crowd alerts and nearby quiet-space candidates;
- keyboard support, visible focus, non-colour indicators and reduced-motion support.

The following evidence is still required before live acceptance:

- Mapbox Directions and Geocoding adapters;
- City of Melbourne sensor-location, past-hour and hourly-history adapters;
- route-to-sensor geospatial matching;
- a mentor-approved public-facility or open-space dataset;
- Transport Victoria access-point data;
- generated historical baselines and prediction-accuracy records;
- CloudWatch alarms, a public deployment and a complete demo checklist.

The MVP intentionally excludes:

- login, profiles, saved routes or user history;
- RDS, EC2 and operational microservices;
- machine-learning models;
- social features and full turn-by-turn navigation.

## Current implementation

The architecture and default mock flow are complete and runnable locally. The frontend, API, scoring, threshold recommendation, source metadata, validation, structured errors, fallback executor and AWS foundation are implemented. Shared ports now isolate every external integration, allowing team members to add live providers without modifying the central route orchestration service.

All current default provider results are explicitly marked `MOCK`. The repository is not yet a live or publicly deployed system.

## Recommended implementation sequence

1. Implement Mapbox destination search and walking alternatives behind `RouteProvider`.
2. Implement City of Melbourne current pedestrian data behind `PedestrianProvider`.
3. Implement geospatial route-to-sensor matching behind `SensorMatcher` and calibrate thresholds with real distributions.
4. Approve and integrate quiet-space and public-transport sources behind their repository ports.
5. Implement versioned snapshots and historical baselines, then validate prediction accuracy.
6. Deploy to AWS staging and complete accessibility, mobile, failure-mode and mentor-demo acceptance.
