# CalmPath Melbourne project overview

## Product goal

CalmPath compares walking routes in Melbourne CBD for people who prefer lower pedestrian pressure. It combines Mapbox route candidates with City of Melbourne, Neon and packaged pedestrian data, then explains each route using LOW, MODERATE or HIGH crowd-load levels.

## Current backend scope

Included:

- public, no-login Vercel application;
- server-side Mapbox walking routes;
- pedestrian observations and historical baselines;
- route-to-sensor proximity matching and explainable scoring;
- threshold warnings, calmer alternatives and quiet-space candidates;
- truthful `LIVE`, `SNAPSHOT` and `MOCK` source metadata;
- Neon read-only repositories, health checks and provider fallbacks;
- stable `/api/routes` contracts, structured errors, tests and CI.

Explicitly excluded by the current handoff:

- turn-by-turn and voice navigation;
- AI-powered sensory navigation;
- next-hour prediction;
- accounts, saved journeys and personal history.

Public-transport access is a maintained backend interface, not a completed data integration. The responsible teammate must provide an approved dataset, attribution and fixtures before it is registered in the composition root.

## Deployment state

The production site is <https://calmpath-melbourne.vercel.app>. Repository code supports live Mapbox and Neon integrations, but each deployment must be checked independently because missing environment variables intentionally trigger fallbacks. Run the production smoke command documented in `requirements-traceability.md` after every release.

## Ownership

Xiangzhonglong owns overall architecture and backend integration: shared contracts, ports, application composition, data truthfulness, error/fallback policy, integration tests, CI and technical documentation. Frontend accessibility, approved transport/place datasets, representative-user testing, mentor sign-off and deployment-secret administration require their named team owners.
