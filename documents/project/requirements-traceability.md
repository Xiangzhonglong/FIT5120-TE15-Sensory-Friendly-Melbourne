# Requirements traceability

| Requirement | Foundation location | Current status | Acceptance evidence still required |
| --- | --- | --- | --- |
| Enter a Melbourne CBD destination | `SearchPanel`, route contract and HTTP validation | Fixed destinations work; CBD bounds are enforced | Live geocoding, invalid-location and out-of-area UI tests |
| Sensory-aware walking route using open pedestrian data | `RouteProvider`, `PedestrianProvider`, `SensorMatcher`, `RouteService`, scoring | Integration ports and mock flow complete | Live provider fixtures, source timestamp and spatial-match evidence |
| HIGH/LOW sensory indicator | `RouteCard` and shared levels | LOW/MODERATE/HIGH use text, shape and colour | Component and accessibility audit |
| Adjust recommendation above user threshold | `RouteService` | Implemented and tested with mock providers | Live-data boundary cases and representative-user validation |
| Public transport access points | contract and `TransportRepository` | Interface and response field complete; default result empty | Approved source, proximity test and map markers |
| Real-time high-density alerts | `/api/crowd`, route alerts and pedestrian source status | Mock provider with source metadata | Live past-hour fixture, freshness and fallback test |
| Quiet refuge locations on demand | `QuietSpaces` and `QuietSpaceRepository` | Mock repository and UI complete | Approved dataset, suitability metadata and user validation |
| Next-hour predictive alert | prediction service | Transparent rule-based boundary complete | Historical baseline algorithm and accuracy comparison |
| Alert accuracy validated | test and documentation boundary | Not complete | Saved cases comparing forecast, observed and city data |
| Accessibility/usability testing | semantic UI and reduced-motion styles | Foundation implemented | Automated axe, keyboard record and representative-user evidence |
| Critical/high defects resolved | quality command and PR process | Local quality gate ready | CI workflow and final defect register |
| Public AWS URL, no login | SAM API, S3 and CloudFront architecture | Infrastructure template complete; deployment not performed | CloudFront URL, restricted CORS and smoke test |
| Stable integration contracts | shared contracts, ports and composition root | Complete for current MVP boundaries | Team review when live schemas are confirmed |
| Live failure does not break the demo | fallback executor and source metadata | Fallback mechanism tested; live/snapshot providers pending | Live-to-snapshot-to-mock integration test |
| Structured errors and request validation | HTTP boundary and `ApiErrorCode` | Implemented and tested | Production API smoke tests |
| Operational observability | structured application logger | Application events implemented | CloudWatch dashboard, alarms and retention policy |

## Definition of architecture ready

- The monorepo installs, type-checks, tests and builds from `code/`.
- The UI completes the planned flow without a secret token.
- The Lambda artifact bundles for Node.js 24.
- Every external dependency has a named port, provider result and fallback expectation.
- Shared contracts expose per-source mode, timestamp, confidence and staleness.
- Invalid requests return stable error codes and request IDs.
- Missing live integrations remain visible and are not presented as complete.

## Definition of live-integration ready

- Mapbox and Melbourne providers pass saved-fixture contract tests.
- Route-to-sensor matching has measurable proximity rules.
- Snapshot age and staleness policies are documented and tested.
- Quiet-space and transport sources are mentor-approved.
- The response reports accurate source modes for mixed live and fallback data.
- CI passes and a staging smoke test exercises the public CloudFront URL.
