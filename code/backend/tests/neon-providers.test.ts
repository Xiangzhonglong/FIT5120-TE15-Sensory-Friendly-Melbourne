import { describe, expect, it } from "vitest";
import { NeonPedestrianProvider } from "../src/adapters/neon/neon-pedestrian-provider.js";
import { NeonQuietSpaceRepository } from "../src/adapters/neon/neon-quiet-space-repository.js";
import type { DatabaseQuery } from "../src/adapters/neon/query.js";
import type { CandidateRoute } from "../src/domain.js";

describe("Neon data adapters", () => {
  const now = () => new Date("2026-08-08T02:00:00.000Z");

  it("uses live minute counts when every returned sensor is current", async () => {
    const query: DatabaseQuery = async () => [{
      location_id: 3,
      sensor_name: "Melbourne Central",
      latitude: "-37.81101524",
      longitude: "144.96429485",
      current_count: "450",
      p95_count: "900",
      live_observed_at: "2026-08-08T01:45:00.000Z",
      baseline_date: "2026-08-07"
    }] as never;
    const result = await new NeonPedestrianProvider(query, now).getCurrentSensors();
    expect(result.status.mode).toBe("LIVE");
    expect(result.data[0]).toMatchObject({ id: "3", currentCount: 450, historicalP95: 900 });
  });

  it("labels historical-only pedestrian values as a snapshot", async () => {
    const query: DatabaseQuery = async () => [{
      location_id: 3,
      sensor_name: "Melbourne Central",
      latitude: -37.811,
      longitude: 144.964,
      current_count: 300,
      p95_count: 800,
      live_observed_at: null,
      baseline_date: "2026-08-07"
    }] as never;
    const result = await new NeonPedestrianProvider(query, now).getCurrentSensors();
    expect(result.status.mode).toBe("SNAPSHOT");
  });

  it("filters Neon quiet spaces by route proximity", async () => {
    const query: DatabaseQuery = async () => [{
      id: "city-library",
      name: "City Library",
      type: "LIBRARY",
      latitude: -37.81706,
      longitude: 144.9659,
      source_label: "City of Melbourne Open Data",
      updated_at: "2026-08-08T00:00:00.000Z"
    }] as never;
    const routes: CandidateRoute[] = [{
      id: "route",
      name: "Route",
      durationMin: 10,
      distanceM: 700,
      geometry: { type: "LineString", coordinates: [[144.963, -37.813], [144.967, -37.818]] }
    }];
    const result = await new NeonQuietSpaceRepository(query, now).findNearRoutes(routes);
    expect(result.status.mode).toBe("SNAPSHOT");
    expect(result.data[0]).toMatchObject({ id: "city-library", type: "LIBRARY" });
  });
});
