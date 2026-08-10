import type { RouteSearchRequest } from "@sensory-melbourne/contracts";
import type { CandidateRoute } from "../../domain.js";
import type { ProviderResult } from "../../ports/provider-result.js";
import type { RouteProvider } from "../../ports/route-provider.js";

type Coordinate = [number, number];

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

const MINIMUM_ROUTE_COUNT = 3;
const MIN_DIRECT_DISTANCE_FOR_WAYPOINTS_M = 400;
const MIN_WAYPOINT_OFFSET_M = 60;
const MAX_WAYPOINT_OFFSET_M = 250;
const WAYPOINT_OFFSET_RATIO = 0.12;
const MIN_BACKWARD_PROGRESS_M = 80;
const MAX_BACKWARD_PROGRESS_RATIO = 0.08;
const SIMILAR_ROUTE_DISTANCE_M = 30;

export class MapboxRouteProvider implements RouteProvider {
  constructor(
    private readonly token: string,
    private readonly now: () => Date = () => new Date(),
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = 6_000
  ) {}

  async getWalkingRoutes(request: RouteSearchRequest): Promise<ProviderResult<CandidateRoute[]>> {
    if (!this.token) throw new Error("MAPBOX_SERVER_TOKEN is not configured");

    const origin: Coordinate = [request.origin.lng, request.origin.lat];
    const destination: Coordinate = [request.destination.lng, request.destination.lat];
    const primaryRoutes = await this.fetchRoutes([origin, destination], request.destinationLabel);
    const allRoutes = [...primaryRoutes];

    if (deduplicateRoutes(primaryRoutes).length < MINIMUM_ROUTE_COUNT) {
      const waypointRoutes = await Promise.allSettled(
        createSideWaypoints(origin, destination).map((waypoint) =>
          this.fetchRoutes([origin, waypoint, destination], request.destinationLabel)
        )
      );
      for (const result of waypointRoutes) {
        if (result.status === "fulfilled") {
          allRoutes.push(...result.value.filter((route) =>
            !hasSignificantBackwardProgress(route, origin, destination)
          ));
        }
      }
    }

    const routes = deduplicateRoutes(allRoutes).map((route, index) => ({
      ...route,
      id: `mapbox-walking-${index + 1}`,
      name: index === 0
        ? `Direct walking route to ${request.destinationLabel}`
        : `Walking alternative ${index + 1} to ${request.destinationLabel}`
    }));
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

  private async fetchRoutes(coordinates: Coordinate[], destinationLabel: string): Promise<CandidateRoute[]> {
    const coordinatePath = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(";");
    const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/walking/${coordinatePath}`);
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

    return payload.routes.flatMap<CandidateRoute>((route, index) => {
      const coordinatesValue = route.geometry?.coordinates;
      if (!Array.isArray(coordinatesValue) || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
        return [];
      }
      const line = coordinatesValue.filter(
        (coordinate): coordinate is Coordinate => Array.isArray(coordinate)
          && coordinate.length >= 2
          && Number.isFinite(coordinate[0])
          && Number.isFinite(coordinate[1])
      );
      if (line.length < 2) return [];
      return [{
        id: `mapbox-raw-${index + 1}`,
        name: `Walking route to ${destinationLabel}`,
        durationMin: Math.max(1, Math.round(Number(route.duration) / 60)),
        distanceM: Math.max(1, Math.round(Number(route.distance))),
        geometry: { type: "LineString", coordinates: line }
      }];
    });
  }
}

function createSideWaypoints(origin: Coordinate, destination: Coordinate): Coordinate[] {
  const meanLatitudeRadians = ((origin[1] + destination[1]) / 2) * Math.PI / 180;
  const metresPerLongitudeDegree = 111_320 * Math.cos(meanLatitudeRadians);
  const eastM = (destination[0] - origin[0]) * metresPerLongitudeDegree;
  const northM = (destination[1] - origin[1]) * 110_540;
  const directDistanceM = Math.hypot(eastM, northM);
  if (directDistanceM < MIN_DIRECT_DISTANCE_FOR_WAYPOINTS_M) return [];

  const offsetM = Math.min(
    MAX_WAYPOINT_OFFSET_M,
    Math.max(MIN_WAYPOINT_OFFSET_M, directDistanceM * WAYPOINT_OFFSET_RATIO)
  );
  const perpendicularEast = -northM / directDistanceM;
  const perpendicularNorth = eastM / directDistanceM;
  const midpoint: Coordinate = [(origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2];

  return [-1, 1].map((side): Coordinate => [
    midpoint[0] + side * perpendicularEast * offsetM / metresPerLongitudeDegree,
    midpoint[1] + side * perpendicularNorth * offsetM / 110_540
  ]);
}

function hasSignificantBackwardProgress(
  route: CandidateRoute,
  origin: Coordinate,
  destination: Coordinate
): boolean {
  const meanLatitudeRadians = ((origin[1] + destination[1]) / 2) * Math.PI / 180;
  const metresPerLongitudeDegree = 111_320 * Math.cos(meanLatitudeRadians);
  const destinationEastM = (destination[0] - origin[0]) * metresPerLongitudeDegree;
  const destinationNorthM = (destination[1] - origin[1]) * 110_540;
  const directDistanceM = Math.hypot(destinationEastM, destinationNorthM);
  if (directDistanceM === 0) return false;

  const unitEast = destinationEastM / directDistanceM;
  const unitNorth = destinationNorthM / directDistanceM;
  const progress = route.geometry.coordinates.map(([lng, lat]) => {
    const eastM = (lng - origin[0]) * metresPerLongitudeDegree;
    const northM = (lat - origin[1]) * 110_540;
    return eastM * unitEast + northM * unitNorth;
  });
  const backwardProgressM = progress.slice(1).reduce((total, value, index) =>
    total + Math.max(0, progress[index]! - value), 0
  );

  return backwardProgressM > Math.max(MIN_BACKWARD_PROGRESS_M, directDistanceM * 0.12)
    && backwardProgressM / route.distanceM > MAX_BACKWARD_PROGRESS_RATIO;
}

function deduplicateRoutes(routes: CandidateRoute[]): CandidateRoute[] {
  return routes.filter((route, index) =>
    routes.findIndex((candidate) => routesAreSimilar(candidate, route)) === index
  );
}

function routesAreSimilar(first: CandidateRoute, second: CandidateRoute): boolean {
  const firstLine = first.geometry.coordinates as Coordinate[];
  const secondLine = second.geometry.coordinates as Coordinate[];
  return averageNearestDistance(firstLine, secondLine) <= SIMILAR_ROUTE_DISTANCE_M
    && averageNearestDistance(secondLine, firstLine) <= SIMILAR_ROUTE_DISTANCE_M;
}

function averageNearestDistance(source: Coordinate[], target: Coordinate[]): number {
  const sampledSource = sampleCoordinates(source);
  const sampledTarget = sampleCoordinates(target);
  const total = sampledSource.reduce((sum, coordinate) => {
    const nearest = Math.min(...sampledTarget.map((candidate) => distanceMetres(coordinate, candidate)));
    return sum + nearest;
  }, 0);
  return total / sampledSource.length;
}

function sampleCoordinates(line: Coordinate[], maximumPoints = 20): Coordinate[] {
  if (line.length <= maximumPoints) return line;
  return Array.from({ length: maximumPoints }, (_, index) =>
    line[Math.round(index * (line.length - 1) / (maximumPoints - 1))] as Coordinate
  );
}

function distanceMetres(first: Coordinate, second: Coordinate): number {
  const meanLatitudeRadians = ((first[1] + second[1]) / 2) * Math.PI / 180;
  const eastM = (second[0] - first[0]) * 111_320 * Math.cos(meanLatitudeRadians);
  const northM = (second[1] - first[1]) * 110_540;
  return Math.hypot(eastM, northM);
}
