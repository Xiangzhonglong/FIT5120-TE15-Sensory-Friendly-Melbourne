import { describe, expect, it, vi } from "vitest";
import { MapboxRouteProvider } from "../src/adapters/mapbox/mapbox-route-provider.js";

const request = {
  origin: { lat: -37.8136, lng: 144.9631 },
  destination: { lat: -37.8183, lng: 144.9671 },
  destinationLabel: "Flinders Street Station",
  preferences: { crowdThreshold: 0.6 }
};

function mapboxRoute(
  coordinates: [number, number][],
  distance = 1200,
  duration = 900
) {
  return {
    distance,
    duration,
    geometry: { type: "LineString", coordinates }
  };
}

function mapboxResponse(routes: ReturnType<typeof mapboxRoute>[]): Response {
  return new Response(JSON.stringify({ code: "Ok", routes }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}

const origin: [number, number] = [144.9631, -37.8136];
const destination: [number, number] = [144.9671, -37.8183];

describe("Mapbox route provider", () => {
  it("uses three distinct alternatives from the primary request without waypoint requests", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => mapboxResponse([
      mapboxRoute([origin, [144.9651, -37.8159], destination], 1200, 900),
      mapboxRoute([origin, [144.9701, -37.8155], destination], 1320, 960),
      mapboxRoute([origin, [144.9581, -37.8162], destination], 1380, 1020)
    ]));
    const provider = new MapboxRouteProvider(
      "test-token",
      () => new Date("2026-08-08T00:00:00.000Z"),
      fetcher as typeof fetch
    );

    const result = await provider.getWalkingRoutes(request);

    expect(result.status.mode).toBe("LIVE");
    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toMatchObject({ distanceM: 1200, durationMin: 15 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(requestedUrl.pathname).toContain("/directions/v5/mapbox/walking/");
    expect(requestedUrl.searchParams.get("alternatives")).toBe("true");
  });

  it("adds left and right waypoint requests when the primary request returns one route", async () => {
    const responses = [
      mapboxResponse([mapboxRoute([origin, destination])]),
      mapboxResponse([mapboxRoute([origin, [144.9600, -37.8170], destination], 1340, 980)]),
      mapboxResponse([mapboxRoute([origin, [144.9710, -37.8150], destination], 1390, 1010)])
    ];
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      responses.shift() as Response
    );
    const provider = new MapboxRouteProvider("test-token", () => new Date(), fetcher as typeof fetch);

    const result = await provider.getWalkingRoutes(request);

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(result.data).toHaveLength(3);
    expect(new Set(result.data.map((route) => JSON.stringify(route.geometry.coordinates))).size).toBe(3);
    for (const call of fetcher.mock.calls.slice(1)) {
      const waypointUrl = new URL(String(call[0]));
      const coordinatePath = waypointUrl.pathname.split("/").at(-1) ?? "";
      expect(coordinatePath.split(";")).toHaveLength(3);
      expect(waypointUrl.searchParams.get("alternatives")).toBe("true");
    }
  });

  it("keeps the primary route when supplemental waypoint requests fail", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      if (fetcher.mock.calls.length === 1) {
        return mapboxResponse([mapboxRoute([origin, destination])]);
      }
      throw new Error("supplemental Mapbox request failed");
    });
    const provider = new MapboxRouteProvider("test-token", () => new Date(), fetcher as typeof fetch);

    const result = await provider.getWalkingRoutes(request);

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({ distanceM: 1200, durationMin: 15 });
  });

  it("rejects a supplemental waypoint route that substantially doubles back", async () => {
    const foldedGeometry: [number, number][] = [
      origin,
      [144.9668, -37.8178],
      [144.9635, -37.8140],
      destination
    ];
    const validGeometry: [number, number][] = [origin, [144.9700, -37.8155], destination];
    const responses = [
      mapboxResponse([mapboxRoute([origin, destination])]),
      mapboxResponse([mapboxRoute(foldedGeometry, 1450, 1050)]),
      mapboxResponse([mapboxRoute(validGeometry, 1360, 990)])
    ];
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      responses.shift() as Response
    );
    const provider = new MapboxRouteProvider("test-token", () => new Date(), fetcher as typeof fetch);

    const result = await provider.getWalkingRoutes(request);

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(result.data).toHaveLength(2);
    expect(result.data.map((route) => route.geometry.coordinates)).toContainEqual(validGeometry);
    expect(result.data.map((route) => route.geometry.coordinates)).not.toContainEqual(foldedGeometry);
  });

  it("rejects unusable upstream responses", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({ code: "NoRoute", routes: [] }), { status: 200 }));
    const provider = new MapboxRouteProvider("test-token", () => new Date(), fetcher as typeof fetch);
    await expect(provider.getWalkingRoutes(request)).rejects.toThrow(/NoRoute|no usable/i);
  });
});
