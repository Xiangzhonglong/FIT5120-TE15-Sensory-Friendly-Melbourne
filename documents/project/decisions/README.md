# Architecture decision records

This directory records decisions that constrain implementation across team-owned modules.

| Decision | Status |
| --- | --- |
| [ADR-001: one serverless API](001-single-serverless-api.md) | Partly superseded by ADR-006 |
| [ADR-002: no account database](002-no-account-database.md) | Accepted |
| [ADR-003: explainable pedestrian scoring](003-explainable-scoring.md) | Accepted with future calibration |
| [ADR-004: live, snapshot and mock fallback](004-source-modes-and-fallback.md) | Accepted |
| [ADR-005: shared contracts and ports](005-shared-contracts-and-ports.md) | Accepted |
| [ADR-006: Vercel and Neon platform](006-vercel-neon-platform.md) | Accepted |

Create a new record when changing a cross-team boundary, deployment topology, persistence model, privacy assumption or scoring approach. Do not rewrite an accepted decision to hide history; supersede it with a new record.
