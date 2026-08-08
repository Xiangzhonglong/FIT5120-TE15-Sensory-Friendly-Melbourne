import type { RouteSearchRequest } from "@sensory-melbourne/contracts";
import type { CandidateRoute } from "../../domain.js";
import type { ProviderResult } from "../../ports/provider-result.js";
import type { RouteProvider } from "../../ports/route-provider.js";

type MapboxRoute = {
  distance?: number;
  duration?: number;
  geometry?: { type?: string; coordinates?: unknown };
};

type MapboxResponse = {
  code?: string;
  message?: string;
  routes?: MapboxRoute[];
};

export class MapboxRouteProvider implements RouteProvider {
  constructor(
    private readonly token: string,
    private readonly now: () => Date = () => new Date(),
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = 6_000
  ) {}

  async getWalkingRoutes(request: RouteSearchRequest): Promise<ProviderResult<CandidateRoute[]>> {
    if (!this.token) throw new Error("MAPBOX_SERVER_TOKEN is not configured");
    const coordinates = [
      `${request.origin.lng},${request.origin.lat}`,
      `${request.destination.lng},${request.destination.lat}`
    ].join(";");
    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}`);
    url.searchParams.set("alternatives", "true");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
    url.searchParams.set("steps", "false");
    url.searchParams.set("access_token", this.token);

    const response = await this.fetcher(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs)
    });
    if (!response.ok) throw new Error(`Mapbox Directions returned HTTP ${response.status}`);
    const payload = await response.json() as MapboxResponse;
    if (payload.code !== "Ok" || !Array.isArray(payload.routes)) {
      throw new Error(payload.message ?? `Mapbox Directions returned ${payload.code ?? "an invalid response"}`);
    }

    const routes = payload.routes.flatMap<CandidateRoute>((route, index) => {
      const coordinatesValue = route.geometry?.coordinates;
      if (!Array.isArray(coordinatesValue) || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
        return [];
      }
      const line = coordinatesValue.filter(
        (coordinate): coordinate is [number, number] => Array.isArray(coordinate)
          && coordinate.length >= 2
          && Number.isFinite(coordinate[0])
          && Number.isFinite(coordinate[1])
      );
      if (line.length < 2) return [];
      return [{
        id: `mapbox-walking-${index + 1}`,
        name: index === 0
          ? `Direct walking route to ${request.destinationLabel}`
          : `Walking alternative ${index + 1} to ${request.destinationLabel}`,
        durationMin: Math.max(1, Math.round(Number(route.duration) / 60)),
        distanceM: Math.max(1, Math.round(Number(route.distance))),
        geometry: { type: "LineString", coordinates: line }
      }];
    });
    if (routes.length === 0) throw new Error("Mapbox Directions returned no usable walking routes");

    return {
      data: routes,
      status: {
        source: "Mapbox Directions API",
        mode: "LIVE",
        timestamp: this.now().toISOString(),
        confidence: "HIGH",
        stale: false
      }
    };
  }
}
