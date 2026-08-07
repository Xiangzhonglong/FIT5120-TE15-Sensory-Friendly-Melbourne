# ADR-004: Preserve live, snapshot and mock source modes

- Status: Accepted
- Date: 2026-08-06

## Decision

Every provider returns source mode, timestamp, confidence and staleness. Integrations attempt LIVE, then timestamped SNAPSHOT, then deterministic MOCK when appropriate.

## Rationale

Third-party availability must not make the demonstration unusable, and fallback data must not be presented as current live information.

## Consequences

- Responses may be `MIXED` across data boundaries.
- Provider owners must define freshness and fallback policy.
- Monitoring must measure fallback and stale-data rates.
- If every configured attempt fails, the API returns `UPSTREAM_UNAVAILABLE`.
