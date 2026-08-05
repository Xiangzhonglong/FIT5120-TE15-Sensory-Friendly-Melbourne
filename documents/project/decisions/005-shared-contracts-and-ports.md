# ADR-005: Use shared contracts and backend ports

- Status: Accepted
- Date: 2026-08-06

## Decision

Use one TypeScript package for public browser/API contracts and backend ports for external provider behaviour. `RouteService` depends on ports, not provider implementations.

## Rationale

The approach allows team members to work independently while preventing interface drift and provider-specific payloads from leaking across the application.

## Consequences

- The architecture owner reviews shared contracts and ports.
- Provider owners transform raw payloads inside adapter directories.
- Implementations are registered in the composition root.
- Contract changes require coordinated consumer and test updates.
