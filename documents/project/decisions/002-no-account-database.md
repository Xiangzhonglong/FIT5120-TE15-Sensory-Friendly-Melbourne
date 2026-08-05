# ADR-002: Do not store user accounts or journey history

- Status: Accepted
- Date: 2026-08-06

## Decision

The MVP has no registration, login, profile database, saved routes or server-side journey history.

## Rationale

The requirement is a public, low-friction route comparison tool. Avoiding personal persistence reduces scope, privacy risk and deployment complexity.

## Consequences

- Preferences remain in the current browser session.
- The backend must not introduce precise journey logging as an accidental substitute for a database.
- Account features require a new privacy and architecture decision.
