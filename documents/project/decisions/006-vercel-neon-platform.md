# ADR-006: Deploy on Vercel with Neon reference data

- Status: Accepted; supersedes the AWS deployment portions of ADR-001
- Date: 2026-08-08

## Decision

Deploy the React application and serverless API together on Vercel in Sydney. Use Neon PostgreSQL through a pooled, read-only application role for pedestrian and quiet-space reference data.

## Rationale

The working production environment is already Vercel plus Neon. Keeping frontend and functions in one project simplifies deployment while the port-and-adapter backend continues to isolate providers.

## Consequences

- `DATABASE_URL`, `MAPBOX_SERVER_TOKEN` and `APP_ORIGIN` are Vercel environment variables.
- No credentials are committed or logged.
- Neon does not store accounts or journey history, so ADR-002 remains in force.
- AWS templates are historical material and are not the active deployment path.
