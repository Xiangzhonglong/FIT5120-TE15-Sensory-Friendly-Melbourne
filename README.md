# Sensory-Friendly Melbourne

CalmPath Melbourne is a FIT5120 Onboarding Team project for the 2026 Semester 2 onboarding iteration.

It is a no-login walking-route comparison prototype for sensory-sensitive adults travelling through Melbourne CBD. The project supports UN Sustainable Development Goal 11 and currently provides a runnable frontend and backend foundation, explainable pedestrian-load scoring, alerts, nearby quiet-space information, and an AWS deployment baseline.

> The current routes and pedestrian counts are deterministic demonstration data. The API explicitly returns `mode: "MOCK"`. The system must not be described as real time until Mapbox and City of Melbourne data are integrated and the API returns `mode: "LIVE"`.

## Repository structure

```text
.
├─ code/                         # Runnable application and engineering configuration
│  ├─ frontend/                 # React, TypeScript and Vite
│  ├─ backend/                  # Lambda-style API
│  ├─ packages/contracts/       # Shared frontend/backend contracts
│  ├─ data/                     # Baseline and fallback data entry points
│  ├─ scripts/                  # Offline preprocessing scripts
│  └─ infra/                    # AWS SAM and CloudFormation
└─ documents/
   └─ project/                  # Project scope, architecture and requirements traceability
```

## Local development

Requires Node.js 24+ and pnpm 11+.

```bash
cd code
pnpm install
pnpm dev
```

Open `http://localhost:5173`. The frontend proxies `/api` requests to `http://localhost:3001`. Without a token, the application uses a placeholder map and demonstration data while preserving the main user flow.

To enable the Mapbox renderer, copy `code/.env.example` to `code/frontend/.env.local` and provide a URL- and scope-restricted `VITE_MAPBOX_TOKEN`.

## Quality checks

```bash
cd code
pnpm check
```

This command runs type checks, automated tests, and production builds for the frontend and backend.

## Documentation

- [Project overview](documents/project/project-overview.md)
- [System architecture](documents/project/architecture.md)
- [Requirements and Definition of Done traceability](documents/project/requirements-traceability.md)
- [AWS deployment guide](code/infra/README.md)
- [Contribution and branch workflow](CONTRIBUTING.md)

## Before pushing to GitHub

Dependencies, build output, environment secrets, coverage output, and temporary files are excluded by `.gitignore`. Run `pnpm install` after the first clone to restore dependencies. Before committing, confirm that no real Mapbox token, AWS credential, or `.env` file is included.
