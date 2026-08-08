import { afterEach, describe, expect, it, vi } from "vitest";
import { createConfiguredApplication } from "../src/application.js";

const request = {
  origin: { lat: -37.8136, lng: 144.9631 },
  destination: { lat: -37.8183, lng: 144.9671 },
  destinationLabel: "Flinders Street Station",
  preferences: { crowdThreshold: 0.6 }
};

describe("configured application", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("selects Mapbox when the server token is configured without changing the API contract", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      code: "Ok",
      routes: [{
        distance: 1200,
        duration: 900,
        geometry: {
          type: "LineString",
          coordinates: [[144.9631, -37.8136], [144.9671, -37.8183]]
        }
      }]
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetcher);

    const application = createConfiguredApplication({
      environment: { MAPBOX_SERVER_TOKEN: "test-token" },
      now: () => new Date("2026-08-08T00:00:00.000Z")
    });
    const response = await application.routeService.search(request);

    expect(response.dataSources.routing.mode).toBe("LIVE");
    expect(response.dataSources.routing.source).toContain("Mapbox");
    expect(response.routes).toHaveLength(1);
    const requestedUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(requestedUrl.pathname).toContain("/directions/v5/mapbox/walking/");
    expect(requestedUrl.pathname).toContain("144.9631,-37.8136");
  });

  it("truthfully reports fallback modes when no deployment secrets are supplied", async () => {
    const application = createConfiguredApplication({
      environment: {},
      now: () => new Date("2026-08-08T00:00:00.000Z")
    });
    const response = await application.routeService.search(request);

    expect(response.dataSources.routing.mode).toBe("MOCK");
    expect(response.dataSources.pedestrian.mode).not.toBe("LIVE");
  });
});
