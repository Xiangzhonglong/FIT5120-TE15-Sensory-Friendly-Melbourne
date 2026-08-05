# Backend integration guide

The backend is a Lambda-compatible TypeScript application organised around ports and adapters. The default composition uses deterministic mock providers so the complete flow remains runnable without credentials.

## Main boundaries

```text
src/
├── adapters/
│   ├── mock/                 # Current default providers
│   └── fallback.ts           # Reusable ordered fallback executor
├── ports/                    # Interfaces implemented by provider owners
├── services/
│   ├── route-service.ts      # Central orchestration
│   ├── scoring.ts            # Explainable pedestrian-load score
│   └── prediction.ts         # Transparent next-hour boundary
├── application.ts            # Composition root
├── validation.ts             # Request validation and CBD bounds
├── http.ts                   # API routing and structured errors
├── logging.ts                # JSON operational logs
└── handler.ts                # AWS Lambda entry point
```

## Run the API locally

From `code/`:

```bash
pnpm --filter @sensory-melbourne/api dev
```

The API listens on `http://localhost:3001`.

## Implement a provider

1. Select the relevant interface in `src/ports`.
2. Create a provider-specific directory under `src/adapters`.
3. Keep raw third-party payload types inside that directory.
4. Transform the payload into the shared backend domain type.
5. Return a `ProviderResult<T>` with truthful source metadata.
6. Add saved-fixture tests without credentials.
7. Ask the architecture owner to register the provider in `application.ts`.

Example shape:

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

## Configure ordered fallback

`executeWithFallback` accepts ordered provider attempts. A successful fallback carries the reasons earlier attempts failed.

```ts
const result = await executeWithFallback("walking routes", [
  { name: "mapbox-live", execute: () => liveProvider.getWalkingRoutes(request) },
  {
    name: "route-snapshot",
    execute: async () => {
      const snapshot = await snapshotRepository.loadRoutes(request);
      if (!snapshot) throw new Error("No route snapshot is available");
      return snapshot;
    }
  },
  { name: "route-mock", execute: () => mockProvider.getWalkingRoutes(request) }
], logger);
```

The integration owner should expose this sequence through a `RouteProvider` implementation or composition wrapper. Do not place provider-selection logic inside `RouteService`.

## HTTP validation

`POST /api/routes` currently enforces:

- JSON content type when a content type is supplied;
- maximum 16 KB request body;
- legal latitude and longitude values;
- destination inside the supported Melbourne CBD bounding box;
- destination label between 1 and 120 characters;
- crowd threshold between 0 and 1.

Stable client-facing errors are defined in the shared contracts. Third-party response bodies and credentials must never be returned to clients.

## Logging

The console logger writes structured JSON events suitable for CloudWatch. Allowed operational fields include request ID, path, response code, latency, route count, alert count, source mode and stable error code.

Never log tokens, credentials or exact user journey histories.

## Tests

```bash
pnpm --filter @sensory-melbourne/api typecheck
pnpm --filter @sensory-melbourne/api test
pnpm --filter @sensory-melbourne/api build
```

Provider pull requests should include mapping fixtures, failure cases and fallback coverage. The central suite covers scoring, route orchestration, source metadata, validation, stable HTTP errors and the generic fallback executor.
