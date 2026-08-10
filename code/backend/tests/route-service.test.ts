import { describe, expect, it } from "vitest";
import { createApplication } from "../src/application.js";
import type { CandidateRoute, PedestrianSensor } from "../src/domain.js";
import { noopLogger } from "../src/logging.js";

const request = {
  origin: { lat: -37.8136, lng: 144.9631 },
  destination: { lat: -37.8102, lng: 144.9628 },
  destinationLabel: "Melbourne Central",
  preferences: { crowdThreshold: 0.6 }
};

const testStatus = {
  source: "Route service test fixture",
  mode: "MOCK" as const,
  timestamp: "2026-08-06T00:00:00.000Z",
  confidence: "HIGH" as const,
  stale: false
};

function candidate(
  id: string,
  index: number,
  durationMin: number,
  distanceM: number
): CandidateRoute {
  return {
    id,
    name: id,
    durationMin,
    distanceM,
    geometry: {
      type: "LineString",
      coordinates: [
        [144.9631, -37.8136],
        [144.9645 + index * 0.003, -37.812],
        [144.9628, -37.8102]
      ]
    }
  };
}

async function searchWithScores(
  routes: CandidateRoute[],
  scores: Record<string, number>,
  crowdThreshold = 0.6
) {
  const routeProvider = {
    async getWalkingRoutes() {
      return { data: routes, status: testStatus };
    }
  };
  const pedestrianProvider = {
    async getCurrentSensors() {
      return { data: [] as PedestrianSensor[], status: testStatus };
    }
  };
  const sensorMatcher = {
    matchRoute(route: CandidateRoute): PedestrianSensor[] {
      const score = scores[route.id] ?? 0;
      return [{
        id: `sensor-${route.id}`,
        name: `Sensor for ${route.id}`,
        location: { lat: -37.812, lng: 144.9645 },
        currentCount: score * 100,
        historicalP95: 100
      }];
    }
  };
  const application = createApplication({
    logger: noopLogger,
    routeProvider,
    pedestrianProvider,
    sensorMatcher
  });

  return application.routeService.search({
    ...request,
    preferences: { crowdThreshold }
  });
}

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

  it("removes routes that exceed the distance or duration detour limits", async () => {
    const result = await searchWithScores([
      candidate("short", 0, 10, 1000),
      candidate("reasonable", 1, 14, 1300),
      candidate("too-far", 2, 12, 1500),
      candidate("too-slow", 3, 16, 1200)
    ], {
      short: 0.4,
      reasonable: 0.3,
      "too-far": 0.1,
      "too-slow": 0.2
    });

    expect(result.routes.map((route) => route.id)).toEqual(["reasonable", "short"]);
  });

  it("removes a backtracking route even when it is within detour limits", async () => {
    const direct = candidate("direct", 0, 10, 1000);
    const normalBend = candidate("normal-bend", 1, 12, 1150);
    const backtracking: CandidateRoute = {
      ...candidate("backtracking", 2, 12, 1200),
      geometry: {
        type: "LineString",
        coordinates: [
          [144.9631, -37.8136],
          [144.9629, -37.8105],
          [144.96305, -37.8130],
          [144.9628, -37.8102]
        ]
      }
    };

    const result = await searchWithScores(
      [direct, normalBend, backtracking],
      { direct: 0.4, "normal-bend": 0.3, backtracking: 0.1 }
    );

    expect(result.routes.map((route) => route.id)).toEqual(["normal-bend", "direct"]);
  });

  it("removes a route that retraces the same corridor in the opposite direction", async () => {
    const direct = candidate("direct", 0, 10, 1000);
    const reverseOverlap: CandidateRoute = {
      ...candidate("reverse-overlap", 2, 12, 1300),
      geometry: {
        type: "LineString",
        coordinates: [
          [144.9631, -37.8136],
          [144.9661, -37.8136],
          [144.9631, -37.8136],
          [144.9628, -37.8102]
        ]
      }
    };

    const result = await searchWithScores(
      [direct, reverseOverlap],
      { direct: 0.4, "reverse-overlap": 0.1 }
    );

    expect(result.routes.map((route) => route.id)).toEqual(["direct"]);
  });

  it("sorts routes by sensory score from low to high", async () => {
    const result = await searchWithScores([
      candidate("high", 0, 12, 1000),
      candidate("low", 1, 13, 1050),
      candidate("medium", 2, 14, 1100)
    ], { high: 0.8, low: 0.2, medium: 0.5 });

    expect(result.routes.map((route) => route.id)).toEqual(["low", "medium", "high"]);
    expect(result.routes.map((route) => route.sensoryScore)).toEqual([0.2, 0.5, 0.8]);
  });

  it("prefers the faster route when sensory scores differ by less than 0.05", async () => {
    const result = await searchWithScores([
      candidate("slightly-calmer", 0, 18, 1100),
      candidate("faster", 1, 12, 1050),
      candidate("higher-score", 2, 13, 1150)
    ], { "slightly-calmer": 0.2, faster: 0.23, "higher-score": 0.6 });

    expect(result.routes.map((route) => route.id)).toEqual([
      "faster",
      "slightly-calmer",
      "higher-score"
    ]);
  });

  it("returns at most three routes and marks exactly one as recommended", async () => {
    const result = await searchWithScores([
      candidate("route-1", 0, 10, 1000),
      candidate("route-2", 1, 11, 1050),
      candidate("route-3", 2, 12, 1100),
      candidate("route-4", 3, 13, 1150),
      candidate("route-5", 4, 14, 1200)
    ], {
      "route-1": 0.5,
      "route-2": 0.4,
      "route-3": 0.3,
      "route-4": 0.2,
      "route-5": 0.1
    }, 0.25);

    expect(result.routes).toHaveLength(3);
    expect(result.routes.map((route) => route.id)).toEqual(["route-5", "route-4", "route-3"]);
    expect(result.routes.filter((route) => route.recommended)).toHaveLength(1);
    expect(result.routes.find((route) => route.recommended)?.id).toBe("route-5");
  });
});
