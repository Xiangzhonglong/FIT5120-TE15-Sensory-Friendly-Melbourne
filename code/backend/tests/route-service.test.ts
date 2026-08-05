import { describe, expect, it } from "vitest";
import { searchRoutes } from "../src/services/route-service.js";

describe("route service", () => {
  it("recommends the lowest-load route that meets the user threshold", () => {
    const result = searchRoutes({
      origin: { lat: -37.8136, lng: 144.9631 },
      destination: { lat: -37.8102, lng: 144.9628 },
      destinationLabel: "Melbourne Central",
      preferences: { crowdThreshold: 0.6 }
    });
    expect(result.routes).toHaveLength(3);
    expect(result.routes.filter((route) => route.recommended)).toHaveLength(1);
    expect(result.routes[0]?.sensoryScore).toBeLessThanOrEqual(result.routes[1]!.sensoryScore);
    expect(result.mode).toBe("MOCK");
  });
});
