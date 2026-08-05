import { describe, expect, it } from "vitest";
import type { PedestrianSensor } from "../src/data/mock-data.js";
import { classifySensoryLevel, routeCrowdScore, sensorIntensity } from "../src/services/scoring.js";

describe("sensory scoring", () => {
  it("normalizes current counts against the historical P95", () => {
    expect(sensorIntensity(400, 800)).toBe(0.5);
    expect(sensorIntensity(900, 800)).toBe(1);
  });

  it("classifies the agreed initial thresholds", () => {
    expect(classifySensoryLevel(0.34)).toBe("LOW");
    expect(classifySensoryLevel(0.35)).toBe("MODERATE");
    expect(classifySensoryLevel(0.7)).toBe("HIGH");
  });

  it("averages the sensors associated with a route", () => {
    const routeSensors: PedestrianSensor[] = [
      { id: "1", name: "A", location: { lat: 0, lng: 0 }, currentCount: 200, historicalP95: 800 },
      { id: "2", name: "B", location: { lat: 0, lng: 0 }, currentCount: 600, historicalP95: 800 }
    ];
    expect(routeCrowdScore(routeSensors)).toBe(0.5);
  });
});
