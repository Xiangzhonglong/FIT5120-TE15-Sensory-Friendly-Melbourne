# ADR-003: Start with explainable pedestrian scoring

- Status: Accepted with future calibration
- Date: 2026-08-06

## Decision

Normalise current pedestrian count against historical P95, aggregate matched sensors and classify the result as LOW, MODERATE or HIGH. Do not use a machine-learning model in the MVP.

## Rationale

The rule is transparent, testable and easy to explain to users and assessors. It avoids claiming predictive precision before sufficient validated data exists.

## Consequences

- The score represents pedestrian pressure, not total sensory comfort.
- Thresholds must be calibrated with real distributions and user feedback.
- Additional sensory factors require approved data and a new documented scoring decision.
