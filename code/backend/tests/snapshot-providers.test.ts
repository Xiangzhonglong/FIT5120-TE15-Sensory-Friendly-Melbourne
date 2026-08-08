import { describe, expect, it } from "vitest";
import { PackagedPedestrianProvider } from "../src/adapters/snapshot/packaged-pedestrian-provider.js";
import { PackagedQuietSpaceRepository } from "../src/adapters/snapshot/packaged-quiet-space-repository.js";
import type { CandidateRoute } from "../src/domain.js";

describe("packaged open-data snapshots", () => {
  const now = () => new Date("2026-08-08T02:00:00.000Z");

  it("combines sensor locations with the matching hourly baseline", async () => {
    const result = await new PackagedPedestrianProvider(now).getCurrentSensors();
    expect(result.status.mode).toBe("SNAPSHOT");
    expect(result.data.length).toBeGreaterThanOrEqual(100);
    expect(result.data.every((sensor) => sensor.historicalP95 > 0)).toBe(true);
  });

  it("returns quiet spaces ordered by distance from candidate routes", async () => {
    const routes: CandidateRoute[] = [{
      id: "city-route",
      name: "City route",
      durationMin: 10,
      distanceM: 800,
      geometry: {
        type: "LineString",
        coordinates: [[144.963, -37.813], [144.967, -37.818]]
      }
    }];
    const result = await new PackagedQuietSpaceRepository(now).findNearRoutes(routes);
    expect(result.status.mode).toBe("SNAPSHOT");
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]!.distanceM).toBeLessThanOrEqual(result.data.at(-1)!.distanceM);
  });
});
