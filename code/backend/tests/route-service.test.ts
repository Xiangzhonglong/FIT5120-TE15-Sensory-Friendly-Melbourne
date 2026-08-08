import { describe, expect, it } from "vitest";
import { createApplication } from "../src/application.js";
import { noopLogger } from "../src/logging.js";

const request = {
  origin: { lat: -37.8136, lng: 144.9631 },
  destination: { lat: -37.8102, lng: 144.9628 },
  destinationLabel: "Melbourne Central",
  preferences: { crowdThreshold: 0.6 }
};

describe("route service", () => {
  it("recommends the lowest-load route that meets the user threshold", async () => {
    const now = new Date("2026-08-06T00:00:00.000Z");
    const application = createApplication({ logger: noopLogger, now: () => now });
    const result = await application.routeService.search(request);

    expect(result.routes).toHaveLength(3);
    expect(result.routes.filter((route) => route.recommended)).toHaveLength(1);
    expect(result.routes[0]?.sensoryScore).toBeLessThanOrEqual(result.routes[1]!.sensoryScore);
    expect(result.mode).toBe("MOCK");
  });

  it("returns integration metadata for every external data boundary", async () => {
    const now = new Date("2026-08-06T00:00:00.000Z");
    const application = createApplication({ logger: noopLogger, now: () => now });
    const result = await application.routeService.search(request, { requestId: "test-request" });

    expect(result.dataSources.routing.mode).toBe("MOCK");
    expect(result.dataSources.pedestrian.mode).toBe("MOCK");
    expect(result.dataSources.quietSpaces.confidence).toBe("LOW");
    expect(result.dataSources.transport.source).toMatch(/transport/i);
    expect(result.transportAccess).toEqual([]);
    expect(result.dataTimestamp).toBe(now.toISOString());
  });

  it("labels non-live crowd alerts as demonstration estimates", async () => {
    const application = createApplication({ logger: noopLogger });
    const result = await application.routeService.search(request);

    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.alerts[0]?.id).toMatch(/^crowd-/);
    expect(result.alerts[0]?.message).toMatch(/^Demonstration crowd estimate/);
  });
});
