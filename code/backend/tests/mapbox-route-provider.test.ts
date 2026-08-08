import { describe, expect, it, vi } from "vitest";
import { MapboxRouteProvider } from "../src/adapters/mapbox/mapbox-route-provider.js";

const request = {
  origin: { lat: -37.8136, lng: 144.9631 },
  destination: { lat: -37.8183, lng: 144.9671 },
  destinationLabel: "Flinders Street Station",
  preferences: { crowdThreshold: 0.6 }
};

describe("Mapbox route provider", () => {
  it("maps walking alternatives into the shared route domain", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      code: "Ok",
      routes: [{
        distance: 1200,
        duration: 900,
        geometry: { type: "LineString", coordinates: [[144.9631, -37.8136], [144.9671, -37.8183]] }
      }]
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const provider = new MapboxRouteProvider(
      "test-token",
      () => new Date("2026-08-08T00:00:00.000Z"),
      fetcher as typeof fetch
    );

    const result = await provider.getWalkingRoutes(request);

    expect(result.status.mode).toBe("LIVE");
    expect(result.data[0]).toMatchObject({ distanceM: 1200, durationMin: 15 });
    const requestedUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(requestedUrl.pathname).toContain("/directions/v5/mapbox/walking/");
    expect(requestedUrl.searchParams.get("alternatives")).toBe("true");
  });

  it("rejects unusable upstream responses", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({ code: "NoRoute", routes: [] }), { status: 200 }));
    const provider = new MapboxRouteProvider("test-token", () => new Date(), fetcher as typeof fetch);
    await expect(provider.getWalkingRoutes(request)).rejects.toThrow(/NoRoute|no usable/i);
  });
});
