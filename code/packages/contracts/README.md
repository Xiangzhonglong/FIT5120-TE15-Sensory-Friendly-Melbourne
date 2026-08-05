# Shared contracts

This package is the public interface between the React application and the API. It contains transport-safe types only; backend provider payloads and internal implementation details do not belong here.

## Ownership

The architecture/integration owner reviews contract changes. A change must be coordinated with all affected frontend, backend and test code.

## Current contract areas

- coordinates and GeoJSON line geometry;
- route-search request and response;
- sensory level, score explanation and confidence;
- current and predicted alerts;
- quiet-space candidates;
- public transport access points;
- per-source mode, timestamp, confidence, staleness and fallback reason;
- stable API error codes.

## Source modes

- `LIVE`: returned directly from an approved current source;
- `SNAPSHOT`: returned from a timestamped last-known-good source;
- `MOCK`: deterministic demonstration material;
- `MIXED`: response-level mode when provider boundaries use different modes.

Adding a new source must not weaken this distinction. Mock or saved data must never be represented as live.

## Change checklist

Before merging a contract change:

1. Explain the requirement that needs the new field.
2. Prefer extending an existing concept over adding a parallel duplicate.
3. Confirm the field is serialisable JSON.
4. Update frontend and backend consumers.
5. Update fixtures and tests.
6. Update architecture and traceability when behaviour changes.
7. Run `pnpm check` from `code/`.
