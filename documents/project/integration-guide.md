# Team integration guide

## Ownership model

| Area | Owner | Deliverable |
| --- | --- | --- |
| Architecture and backend | Xiangzhonglong | Contracts, ports, composition, security, fallback, integration tests and docs |
| Frontend and accessibility | Frontend owner | UI, keyboard/mobile behaviour and accessibility evidence |
| Mapbox deployment | Deployment owner with backend owner | Vercel server token, redeploy and live smoke evidence |
| Pedestrian data | Data owner with backend owner | Feed policy, calibration and data-quality evidence |
| Quiet spaces and transport | Places owner | Approved datasets, attribution, fixtures and suitability rules |
| QA and acceptance | Whole team/mentor | User testing, defect register and sign-off |

## Backend integration contract

New providers implement a port under `code/backend/src/ports` and keep raw third-party payloads inside their adapter. Providers must return the shared domain model, accurate source mode and timestamp, documented freshness rules, safe timeout/error behaviour and saved non-secret fixture tests.

Only `code/backend/src/application.ts` registers providers. Team code must not import provider adapters directly into `RouteService` or change `/api/routes` without coordination.

## Completed backend integrations

- Mapbox walking route adapter using `MAPBOX_SERVER_TOKEN` and `longitude,latitude` coordinates.
- City of Melbourne past-hour pedestrian adapter.
- Neon pedestrian and quiet-space read-only repositories using `DATABASE_URL`.
- Packaged baseline/snapshot adapters and geospatial sensor matcher.
- Live-to-snapshot-to-mock fallback with truthful source metadata.
- CI quality gate and production smoke command.

## Remaining handoffs

### Deployment owner

1. Configure `MAPBOX_SERVER_TOKEN`, `DATABASE_URL` and exact `APP_ORIGIN` in Vercel Preview and Production.
2. Decide whether `LIVE_DATA_ENABLED=true` is approved.
3. Redeploy the latest `main` and run `REQUIRE_LIVE=true pnpm smoke:production`.
4. Save the output as release evidence; never copy secret values into tickets or documentation.

### Places/transport owner

Provide the approved source, attribution, update policy and fixture for transport stops. Implement `TransportRepository` or hand the source contract to Xiangzhonglong for integration. Until then, the API deliberately reports an empty `MOCK` transport result.

### Frontend/QA team

Complete accessibility, mobile and representative-user validation and record mentor approval. These are acceptance requirements but are not backend code tasks.

## Pull-request checklist

1. The provider port is not bypassed.
2. No token, connection string or personal journey appears in code, fixtures or logs.
3. Source mode, freshness and fallback reason are truthful.
4. Failure and fallback paths are tested.
5. `pnpm check` passes.
6. Traceability and environment-variable documentation are updated.
