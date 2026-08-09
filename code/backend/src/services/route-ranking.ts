import type { CandidateRoute } from "../domain.js";

type Coordinate = [number, number];

export const MAX_DISTANCE_RATIO = 1.4;
export const MAX_DURATION_RATIO = 1.5;

const SIMILAR_ROUTE_DISTANCE_M = 30;
const MAX_COMPARISON_POINTS = 20;

/** Removes duplicate or highly similar routes while preserving input order. */
export function deduplicateRoutes(routes: CandidateRoute[]): CandidateRoute[] {
  return routes.filter((route, index) =>
    routes.findIndex((candidate) => routesAreSimilar(candidate, route)) === index
  );
}

/** Removes routes that are excessive detours compared with the best raw candidates. */
export function filterExcessiveDetours(routes: CandidateRoute[]): CandidateRoute[] {
  if (routes.length === 0) return [];

  const shortestDistanceM = Math.min(...routes.map((route) => route.distanceM));
  const fastestDurationMin = Math.min(...routes.map((route) => route.durationMin));

  return routes.filter((route) =>
    route.distanceM <= shortestDistanceM * MAX_DISTANCE_RATIO
    && route.durationMin <= fastestDurationMin * MAX_DURATION_RATIO
  );
}

/** Applies candidate-level rules before sensory scoring and ranking. */
export function filterRouteCandidates(routes: CandidateRoute[]): CandidateRoute[] {
  return filterExcessiveDetours(deduplicateRoutes(routes));
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
  const totalDistanceM = sampledSource.reduce((sum, coordinate) => {
    const nearestDistanceM = Math.min(
      ...sampledTarget.map((candidate) => distanceMetres(coordinate, candidate))
    );
    return sum + nearestDistanceM;
  }, 0);

  return totalDistanceM / sampledSource.length;
}

function sampleCoordinates(line: Coordinate[]): Coordinate[] {
  if (line.length <= MAX_COMPARISON_POINTS) return line;

  return Array.from({ length: MAX_COMPARISON_POINTS }, (_, index) =>
    line[Math.round(index * (line.length - 1) / (MAX_COMPARISON_POINTS - 1))] as Coordinate
  );
}

function distanceMetres(first: Coordinate, second: Coordinate): number {
  const meanLatitudeRadians = ((first[1] + second[1]) / 2) * Math.PI / 180;
  const eastM = (second[0] - first[0]) * 111_320 * Math.cos(meanLatitudeRadians);
  const northM = (second[1] - first[1]) * 110_540;
  return Math.hypot(eastM, northM);
}
