# Team integration guide

## Ownership model

| Area | Primary owner | Owned boundary |
| --- | --- | --- |
| Architecture and backend integration | Architecture owner | Shared contracts, ports, `RouteService`, composition, error policy and integration tests |
| Frontend and accessibility | Frontend owner | React components, visual states, keyboard use, mobile layout and UI tests |
| Mapbox routing | Routing owner | Geocoding, walking alternatives and map-specific transformations |
| Melbourne pedestrian data | Data owner | Sensor data, historical baseline, matching and score calibration |
| Quiet spaces and public transport | Places owner | Approved source selection, proximity and source metadata |
| AWS, CI and QA | Platform owner | Deployment, secrets, automated checks, monitoring and acceptance evidence |

## Integration contract

Provider owners implement an interface in `code/backend/src/ports` and place provider-specific code under `code/backend/src/adapters`. Raw provider payload types stay inside that adapter.

Provider implementations must:

- return the shared domain model;
- include accurate source status;
- use server-side credentials only where required;
- define timeout behaviour;
- include saved-fixture tests;
- avoid logging tokens or full user journeys;
- document rate limits and fallback expectations.

The architecture owner registers accepted providers in `code/backend/src/application.ts`. Provider code must not be imported directly into `RouteService`.

## Handoff checklist

Before requesting integration, the provider owner supplies:

- implementation files;
- provider-specific payload types;
- mapping tests using saved, non-secret fixtures;
- documented environment variables;
- source name and timestamp semantics;
- confidence and staleness rules;
- error and timeout behaviour;
- the expected fallback provider;
- `pnpm check` results.

## Pending team handoffs

### Mapbox

- Implement `RouteProvider`.
- Support destination geocoding and multiple walking alternatives.
- Return shared `CandidateRoute` geometry.
- Keep browser and server tokens separate.
- Provide timeout and rate-limit fixtures.

### City of Melbourne pedestrian data

- Implement `PedestrianProvider`.
- Implement a real `SensorMatcher`.
- Define current-count and historical-P95 time windows.
- Record data timestamps, freshness and confidence.
- Provide live-to-snapshot fallback tests.

### Quiet spaces and transport

- Obtain mentor approval for both sources.
- Implement `QuietSpaceRepository` and `TransportRepository`.
- Calculate route proximity.
- Avoid claiming a location is guaranteed quiet.
- Include source attribution and update time.

### Snapshot and baseline

- Implement `SnapshotRepository` using versioned packaged JSON or private S3.
- Define maximum acceptable age per source.
- Extend the offline baseline job with the approved historical dataset.
- Keep snapshot contents non-personal and reviewable.

### Platform and QA

- Add a CI workflow running `pnpm check`.
- Deploy the SAM stack to staging.
- Configure secrets without command-history exposure.
- Restrict production CORS to the CloudFront origin.
- Add CloudWatch alarms and a public smoke test.

## Integration owner checklist

For every integration pull request:

1. Confirm the port has not been bypassed.
2. Confirm shared contracts change only when necessary.
3. Confirm source mode and timestamps are truthful.
4. Confirm fallback behaviour is tested.
5. Confirm provider errors are translated safely.
6. Run the complete quality gate.
7. Update requirements traceability.
