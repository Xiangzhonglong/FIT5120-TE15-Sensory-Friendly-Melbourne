# Requirements Traceability

| Requirement | Foundation location | Current status | Acceptance evidence to add |
| --- | --- | --- | --- |
| Enter a Melbourne CBD destination | `SearchPanel` and route request contract | Demonstrable with fixed CBD destinations | Geocoding test and invalid/out-of-area case |
| Sensory-aware walking route using open pedestrian data | `route-service` + `scoring` | Mock adapter and real scoring boundary | Live Melbourne adapter fixture and timestamp |
| High/Low sensory indicator | `RouteCard` | LOW/MODERATE/HIGH with text, shape and colour | Component/a11y test |
| Adjust above user threshold | route recommendation logic | Implemented against mock routes | Threshold boundary tests |
| Public transport access points | data repository seam | Not implemented | Approved source, proximity test and map marker |
| Real-time high-density alerts | `/api/crowd`, route alerts | Mock adapter | Live past-hour fixture and fallback test |
| Quiet refuge locations on demand | `QuietSpaces` and snapshot seam | Curated placeholders clearly labelled | Approved dataset and user validation notes |
| Next-hour predictive alert | `prediction` service | Transparent rule-based foundation | Baseline pipeline and accuracy comparison |
| Alert accuracy validated | test/documentation boundary | Not yet complete | Saved cases comparing forecast/current/city data |
| Accessibility/usability testing | semantic UI and reduced-motion styles | Foundation implemented | axe, keyboard and representative-user record |
| Critical/high defects resolved | test/build pipeline | Process ready | Defect register before demo |
| Public AWS URL, no login | SAM API template + SPA architecture | Deployment not performed | CloudFront URL and smoke test |

## Definition of "architecture ready"

- The monorepo installs, type-checks, tests and builds from `code/`.
- The UI can complete the planned interaction against the local API with no secret token.
- The Lambda artifact is bundled for Node.js 24.
- Every external data dependency has a named adapter boundary and fallback expectation.
- Missing live integrations are visible in this matrix and are not presented as complete.
