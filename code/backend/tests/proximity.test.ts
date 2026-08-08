import { describe, expect, it } from "vitest";
import { distanceToLineM } from "../src/geo.js";
import { ProximitySensorMatcher } from "../src/adapters/proximity-sensor-matcher.js";
import type { CandidateRoute, PedestrianSensor } from "../src/domain.js";

const route: CandidateRoute = {
  id: "route",
  name: "Test route",
  durationMin: 10,
  distanceM: 500,
  geometry: {
    type: "LineString",
    coordinates: [[144.96, -37.81], [144.97, -37.81]]
  }
};

describe("geospatial proximity", () => {
  it("calculates point-to-route distance", () => {
    expect(distanceToLineM({ lat: -37.8105, lng: 144.965 }, route.geometry)).toBeGreaterThan(50);
    expect(distanceToLineM({ lat: -37.8105, lng: 144.965 }, route.geometry)).toBeLessThan(60);
  });

  it("matches only sensors near a candidate route", () => {
    const sensors: PedestrianSensor[] = [
      { id: "near", name: "Near", location: { lat: -37.8103, lng: 144.965 }, currentCount: 10, historicalP95: 20 },
      { id: "far", name: "Far", location: { lat: -37.82, lng: 144.98 }, currentCount: 10, historicalP95: 20 }
    ];
    const matcher = new ProximitySensorMatcher(120, 350);
    expect(matcher.matchRoute(route, sensors).map((sensor) => sensor.id)).toEqual(["near"]);
  });
});
