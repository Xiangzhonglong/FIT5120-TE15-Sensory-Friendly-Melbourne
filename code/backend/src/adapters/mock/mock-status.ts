import type { Confidence, DataSourceStatus } from "@sensory-melbourne/contracts";

export function mockStatus(
  source: string,
  timestamp: string,
  confidence: Confidence = "MEDIUM"
): DataSourceStatus {
  return { source, mode: "MOCK", timestamp, confidence, stale: false };
}
