# Sensory-Friendly Melbourne project overview

## Project goal

Provide a no-login walking-route comparison tool for sensory-sensitive adults travelling through Melbourne CBD. Rather than simply recommending the shortest route, the system combines candidate walking routes with nearby pedestrian data to provide explainable sensory-load levels, congestion alerts, alternative routes, and nearby public places where a user may pause.

## Epics

### Epic 1: sensory-friendly route planning and real-time navigation

- The user enters a destination within Melbourne CBD.
- The system returns at least one walking route and uses open pedestrian data to calculate sensory load.
- Every route displays a LOW, MODERATE, or HIGH label without relying on colour alone.
- When a route exceeds the user's threshold, the system displays a warning and recommends a calmer alternative.
- Public transport access points are shown near the route.

### Epic 2: sensory environment monitoring

- Display real-time alerts for high-density pedestrian areas.
- Show nearby parks, libraries, and quieter public spaces on demand.
- Use historical hourly trends to provide alerts for the next hour.
- Predictions must state their basis, timestamp, and confidence and must not be presented as certain outcomes.

## Confirmed MVP boundaries

Required:

- A public AWS HTTPS URL.
- No registration, login, user account, or account database.
- Destination selection and candidate walking routes.
- Explainable scoring based on pedestrian data.
- Text-based LOW, MODERATE, and HIGH levels.
- A user-defined threshold, congestion alerts, and alternative routes.
- Pedestrian alerts and nearby quiet spaces.
- Baseline accessibility support including keyboard use, visible focus, non-colour cues, and reduced motion.

Required before acceptance with live data:

- Live Mapbox Directions and Geocoding adapters.
- City of Melbourne sensor-location, recent-count, and hourly-history adapters.
- A mentor-approved public-facilities or open-space dataset.
- Transport Victoria stop data.
- Historical baseline generation and prediction-accuracy evidence.
- CloudWatch alarms, public deployment, and a complete demonstration checklist.

Out of scope for this iteration:

- Login, profiles, favourites, or journey history.
- RDS, EC2, or a microservice split.
- Machine-learning models.
- Social features or full turn-by-turn navigation.

## Architecture foundation

- `code/frontend/`: a React, TypeScript, and Vite single-page application with a low-stimulation visual system, route cards, alerts, quiet spaces, and a lazy Mapbox integration boundary.
- `code/backend/`: a Lambda-style API separated into HTTP, route-service, scoring, prediction, and data-adapter layers.
- `code/packages/contracts/`: shared request and response types that reduce frontend/backend contract drift.
- `code/data/` and `code/scripts/`: entry points for historical baselines, fallback snapshots, and offline preprocessing.
- `code/infra/`: AWS SAM and CloudFormation definitions for Lambda, API Gateway, private S3, CloudFront OAC, and `/api/*` forwarding.
- `documents/project/requirements-traceability.md`: a requirement-by-requirement record of code locations, current status, and outstanding acceptance evidence.

## Current state

The architecture foundation is complete and runs locally. Without credentials, the application demonstrates the main user flow using deterministic data. Automated tests cover scoring, threshold-based recommendations, and the prediction boundary. Every response is explicitly labelled `MOCK` so demonstration data is never presented as live data.

## Recommended next steps

1. Integrate Mapbox destination search and walking alternatives while retaining the mock fallback.
2. Integrate City of Melbourne pedestrian counts and sensor locations with timestamps and failure fallback.
3. Complete spatial sensor-to-route matching and calibrate LOW, MODERATE, and HIGH thresholds against real distributions.
4. Confirm quiet-space and public-transport sources, then add their map layers and data attribution.
5. Generate the historical baseline and add prediction-accuracy tests.
6. Deploy to AWS staging and complete accessibility, mobile, failure-mode, and mentor-demonstration acceptance checks.
