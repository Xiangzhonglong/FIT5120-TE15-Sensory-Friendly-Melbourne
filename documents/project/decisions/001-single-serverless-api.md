# ADR-001: Use one serverless API

- Status: Accepted
- Date: 2026-08-06

## Decision

Use one Node.js Lambda behind API Gateway for the MVP. Separate responsibilities through internal modules, ports and adapters rather than operational microservices.

## Rationale

The topology is inexpensive, explainable and practical for a student team. One deployment unit reduces networking, permissions and monitoring overhead while retaining clean code boundaries.

## Consequences

- All API routes deploy together.
- A slow external provider can affect the shared Lambda unless timeouts and fallbacks are enforced.
- A service may be extracted later only when scaling, ownership or reliability evidence justifies the operational cost.
