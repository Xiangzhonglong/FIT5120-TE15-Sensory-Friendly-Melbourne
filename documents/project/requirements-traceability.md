# Requirements traceability

Status values distinguish repository completion from deployment and team-owned acceptance evidence.

| Requirement | Backend/architecture evidence | Status | Remaining owner/action |
| --- | --- | --- | --- |
| Stable route API | Shared contracts, validation, `RouteService` and Vercel adapter | Complete | Frontend must retain the current request/response contract |
| Real walking alternatives | `MapboxRouteProvider`, timeout and mapping tests | Code complete | Deployment owner configures `MAPBOX_SERVER_TOKEN` and redeploys |
| Pedestrian data | City live, Neon and packaged providers with truthful source modes | Code complete | Enable live feed as agreed; minute table is currently empty |
| Route-to-sensor matching | `ProximitySensorMatcher` and tests | Complete | Data owner may calibrate corridor distance |
| Explainable crowd score | Median/P95 baseline, scoring and threshold tests | Complete | Representative users validate thresholds |
| Quiet-space candidates | Neon and packaged repositories with proximity filtering | Complete | Places owner confirms suitability/attribution |
| Public transport access | Stable port and response field | Interface only | Places/transport owner supplies an approved source and fixtures |
| Resilient fallback | Live/Neon/snapshot/mock chains and tests | Complete | Production smoke test records deployed modes |
| Neon security | Migration, read-only role guidance, env-only connection and DB health | Complete | Deployment owner retains pooled read-only credentials in Vercel |
| CI quality gate | GitHub Actions runs install and `pnpm check` | Complete | Repository admin confirms Actions is enabled |
| Public deployment | Vercel production URL and smoke command | Deployed, latest integration unverified | Redeploy latest `main`, set env vars, run live smoke test |
| Production CORS | `APP_ORIGIN` support | Code complete | Set exact Vercel origin in Preview/Production |
| Accessibility/usability | Outside backend ownership | External evidence required | Frontend/QA team performs keyboard, mobile and representative-user tests |
| Mentor acceptance | Outside repository implementation | External evidence required | Team records mentor scope approval and defect sign-off |
| Next-hour prediction | Excluded by the current backend handoff | Not in current scope | Obtain written scope decision if original brief still requires it |

## Backend acceptance commands

From `code/`:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm smoke:production
REQUIRE_LIVE=true pnpm smoke:production
```

The final command is the deployment gate. It must not pass by relabelling historical or mock data as live.
