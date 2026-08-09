import { describe, expect, it } from "vitest";
import { NeonPedestrianProvider } from "../src/adapters/neon/neon-pedestrian-provider.js";
import { NeonQuietSpaceRepository } from "../src/adapters/neon/neon-quiet-space-repository.js";
import type { DatabaseQuery } from "../src/adapters/neon/query.js";
import type { CandidateRoute } from "../src/domain.js";

describe("Neon data adapters", () => {
  const now = () => new Date("2026-08-08T02:00:00.000Z");

  it("uses only hourly historical baselines and reports a snapshot", async () => {
    let executedSql = "";
    let executedParameters: unknown[] | undefined;
    const query: DatabaseQuery = async (sql, parameters) => {
      executedSql = sql;
      executedParameters = parameters;
      return [{
        location_id: 3,
        sensor_name: "Melbourne Central",
        latitude: "-37.81101524",
        longitude: "144.96429485",
        current_count: "300",
        p95_count: "900",
        baseline_date: "2026-08-07"
      }] as never;
    };
    const result = await new NeonPedestrianProvider(query, now).getCurrentSensors();

    expect(executedSql).toContain("FROM pedestrian_count_hourly");
    expect(executedSql).toContain("baseline.median_count::double precision AS current_count");
    expect(executedSql).not.toContain("pedestrian_count_minute");
    expect(executedSql).not.toMatch(/\brecent\s+AS\s*\(/i);
    expect(executedParameters).toEqual([5, 12]);
    expect(result.data[0]).toMatchObject({
      id: "3",
      name: "Melbourne Central",
      location: { lat: -37.81101524, lng: 144.96429485 },
      currentCount: 300,
      historicalP95: 900
    });
    expect(result.status).toMatchObject({
      source: "City of Melbourne historical baseline via Neon",
      mode: "SNAPSHOT",
      confidence: "MEDIUM",
      stale: false
    });
  });

  it("marks old historical baselines as stale snapshots", async () => {
    const query: DatabaseQuery = async () => [{
      location_id: 3,
      sensor_name: "Melbourne Central",
      latitude: -37.811,
      longitude: 144.964,
      current_count: 300,
      p95_count: 800,
      baseline_date: "2025-01-01"
    }] as never;
    const result = await new NeonPedestrianProvider(query, now).getCurrentSensors();
    expect(result.status.mode).toBe("SNAPSHOT");
    expect(result.status.stale).toBe(true);
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
