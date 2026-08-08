# Backend integration guide

The backend is a TypeScript application deployed through Vercel Functions. It follows a ports-and-adapters structure so routing, pedestrian data and quiet-space providers can be implemented independently from the deployment platform.

The current application composition uses deterministic mock providers. The deployed `/api/routes` endpoint must not be described as live until the backend team connects approved routing and pedestrian data providers.

## Current deployment boundaries

```text
code/
├── api/
│   ├── health.ts                  # Vercel API health endpoint
│   ├── db-health.ts               # Neon connectivity endpoint
│   └── routes.ts                  # Vercel route-search endpoint
└── backend/
    └── src/
        ├── adapters/
        │   ├── mock/              # Current deterministic providers
        │   ├── neon/              # Neon database infrastructure adapters
        │   └── fallback.ts        # Ordered fallback executor
        ├── ports/                 # Interfaces implemented by provider owners
        ├── services/
        │   ├── route-service.ts   # Central route orchestration
        │   └── scoring.ts         # Explainable pedestrian-load score
        ├── application.ts         # Composition root
        ├── validation.ts          # Request validation and CBD bounds
        ├── http.ts                # Internal API routing and structured errors
        ├── logging.ts             # Structured JSON operational logs
        ├── vercel.ts              # Vercel Function request adapter
        ├── local.ts               # Local development server
        └── handler.ts             # Legacy AWS-compatible entry point
```

`handler.ts` is retained for compatibility with the original architecture. The current Production deployment enters the backend through `api/*.ts` and `backend/src/vercel.ts`.

## Vercel request flow

The current request flow is:

```text
Browser
  -> /api/*
  -> Vercel Function
  -> backend/src/vercel.ts
  -> backend/src/http.ts
  -> application services and providers
```

Vercel provides the public HTTPS endpoint and `/api/*` routing. A separate API Gateway is not required.

The deployed endpoints are:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Confirms that the API runtime is available |
| `GET` | `/api/db-health` | Confirms that Neon PostgreSQL is reachable |
| `POST` | `/api/routes` | Validates and processes a route-search request |

## Current data status

The Neon database currently contains cleaned relational data for:

- pedestrian sensor locations;
- historical hourly pedestrian counts;
- quiet-space candidates.

The `pedestrian_count_minute` table currently contains no near-real-time records.

`/api/db-health` confirms database connectivity only. The current `/api/routes` business flow still uses mock providers and does not yet use Neon data to calculate live route scores.

Static assets such as `baseline.json` may be loaded by a future backend provider when required. They are not automatically used merely because they exist in the repository.

## Product scope

The current project scope does not include AI-powered sensory navigation or next-hour crowd prediction.

Until the real backend integration is completed:

- responses must continue to report their source mode truthfully;
- mock data must be labelled as `MOCK`;
- historical estimates must not be described as current live conditions;
- simulated near-real-time records must be labelled as simulated data.

The application does not require user login and must not store user journeys, preferences or personal information.

## Run the API locally

From `code/`:

```bash
pnpm --filter @sensory-melbourne/api dev
```

The local API listens on `http://localhost:3001`.

## Implement a provider

Backend integration owners should:

1. Select the relevant interface in `src/ports`.
2. Create a provider-specific directory under `src/adapters`.
3. Keep raw third-party payload types inside that adapter.
4. Transform external payloads into shared backend domain types.
5. Return truthful source metadata.
6. Add fixture-based tests that do not require committed credentials.
7. Register the provider in `application.ts`.

Example:

```ts
export class ExampleRouteProvider implements RouteProvider {
  async getWalkingRoutes(request: RouteSearchRequest) {
    const payload = await callExternalService(request);

    return {
      data: mapPayloadToCandidateRoutes(payload),
      status: {
        source: "Approved routing source",
        mode: "LIVE",
        timestamp: new Date().toISOString(),
        confidence: "HIGH",
        stale: false
      }
    };
  }
}
```

Provider selection and fallback logic must remain outside `RouteService`.

## Neon database access

Server-side database adapters use the `DATABASE_URL` environment variable.

In Vercel, `DATABASE_URL` is configured as Sensitive for Preview and Production. It uses the pooled connection string for the read-only `calmpath_app` database role.

Backend code must not:

- use Neon owner credentials at runtime;
- expose the connection string to the browser;
- prefix the variable with `VITE_`;
- return database errors or credentials to clients;
- write to database tables unless a separately reviewed write role is introduced.

## HTTP validation

`POST /api/routes` currently enforces:

- JSON content type when supplied;
- a maximum 16 KB request body;
- legal latitude and longitude values;
- destination coordinates inside the supported Melbourne CBD boundary;
- destination labels between 1 and 120 characters;
- crowd thresholds between 0 and 1.

Stable client-facing errors are defined in the shared contracts. Raw third-party responses and credentials must never be returned to clients.

## Logging

The console logger writes structured JSON that can be inspected through Vercel Runtime Logs.

Allowed operational fields include:

- request ID;
- request path and method;
- response status;
- execution duration;
- route and alert counts;
- source mode;
- stable error code.

Logs must never contain tokens, database connection strings, credentials or precise user journey histories.

## Tests

From `code/`:

```bash
pnpm --filter @sensory-melbourne/api typecheck
pnpm --filter @sensory-melbourne/api test
pnpm --filter @sensory-melbourne/api build
```

To verify the complete workspace:

```bash
pnpm check
pnpm dlx vercel@latest build --prod
```

Provider pull requests should include mapping fixtures, failure cases and fallback coverage. Deployment changes should also verify `/api/health` and `/api/db-health` in Preview before Production.
