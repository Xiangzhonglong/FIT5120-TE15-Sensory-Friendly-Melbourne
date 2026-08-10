import type { RouteOption } from "@sensory-melbourne/contracts";
import type { CandidateRoute } from "../domain.js";

type Coordinate = [number, number];

export const MAX_DISTANCE_RATIO = 1.4;
export const MAX_DURATION_RATIO = 1.5;
export const SENSORY_SCORE_TIE_THRESHOLD = 0.05;
export const MAX_RETURNED_ROUTES = 3;

const SIMILAR_ROUTE_DISTANCE_M = 30;
const MAX_COMPARISON_POINTS = 20;
const MIN_BACKWARD_PROGRESS_M = 80;
const MAX_BACKWARD_PROGRESS_RATIO = 0.08;
const REVERSE_OVERLAP_DISTANCE_M = 25;
const MIN_REVERSE_OVERLAP_M = 60;
const MIN_ALONG_ROUTE_SEPARATION_M = 100;
const MAX_REVERSE_DIRECTION_DOT_PRODUCT = -0.5;

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

/** Removes routes that substantially move backwards or retrace the same corridor. */
export function filterBacktrackingRoutes(routes: CandidateRoute[]): CandidateRoute[] {
  return routes.filter((route) => !routeHasSignificantBacktracking(route));
}

/** Applies candidate-level rules before sensory scoring and ranking. */
export function filterRouteCandidates(routes: CandidateRoute[]): CandidateRoute[] {
  return filterExcessiveDetours(filterBacktrackingRoutes(deduplicateRoutes(routes)));
}

/** Sorts scored routes, selects at most three, and marks exactly one as recommended. */
export function rankRouteOptions(routes: RouteOption[], crowdThreshold: number): RouteOption[] {
  const threshold = Math.max(0, Math.min(1, crowdThreshold));
  const rankedRoutes = routes
    .map((route) => ({ ...route, recommended: false }))
    .sort((first, second) => {
      if (Math.abs(first.sensoryScore - second.sensoryScore) < SENSORY_SCORE_TIE_THRESHOLD) {
        return first.durationMin - second.durationMin || first.sensoryScore - second.sensoryScore;
      }
      return first.sensoryScore - second.sensoryScore;
    })
    .slice(0, MAX_RETURNED_ROUTES);

  const withinThresholdIndex = rankedRoutes.findIndex((route) => route.sensoryScore <= threshold);
  if (rankedRoutes.length > 0) {
    const lowestScoreIndex = rankedRoutes.reduce(
      (bestIndex, route, index) =>
        route.sensoryScore < rankedRoutes[bestIndex]!.sensoryScore ? index : bestIndex,
      0
    );
    rankedRoutes[withinThresholdIndex >= 0 ? withinThresholdIndex : lowestScoreIndex]!.recommended = true;
  }

  return rankedRoutes;
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

function routeHasSignificantBacktracking(route: CandidateRoute): boolean {
  const line = route.geometry.coordinates as Coordinate[];
  if (line.length < 3 || route.distanceM <= 0) return false;

  return hasSignificantBackwardProgress(line, route.distanceM)
    || hasSignificantReverseOverlap(line, route.distanceM);
}

function hasSignificantBackwardProgress(line: Coordinate[], routeDistanceM: number): boolean {
  const origin = line[0]!;
  const destination = line.at(-1)!;
  const localLine = toLocalMetres(line, origin);
  const destinationPoint = localLine.at(-1)!;
  const directDistanceM = Math.hypot(destinationPoint[0], destinationPoint[1]);
  if (directDistanceM === 0) return true;

  const unitEast = destinationPoint[0] / directDistanceM;
  const unitNorth = destinationPoint[1] / directDistanceM;
  const progress = localLine.map(([eastM, northM]) => eastM * unitEast + northM * unitNorth);
  const backwardProgressM = progress.slice(1).reduce((total, value, index) =>
    total + Math.max(0, progress[index]! - value), 0
  );

  return backwardProgressM > Math.max(MIN_BACKWARD_PROGRESS_M, directDistanceM * 0.12)
    && backwardProgressM / routeDistanceM > MAX_BACKWARD_PROGRESS_RATIO;
}

function hasSignificantReverseOverlap(line: Coordinate[], routeDistanceM: number): boolean {
  const localLine = toLocalMetres(line, line[0]!);
  let distanceAlongRouteM = 0;
  const segments = localLine.slice(1).flatMap((end, index) => {
    const start = localLine[index]!;
    const deltaEast = end[0] - start[0];
    const deltaNorth = end[1] - start[1];
    const lengthM = Math.hypot(deltaEast, deltaNorth);
    if (lengthM < 3) return [];
    const segment = {
      lengthM,
      midpoint: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2] as Coordinate,
      distanceAlongRouteM: distanceAlongRouteM + lengthM / 2,
      unitEast: deltaEast / lengthM,
      unitNorth: deltaNorth / lengthM
    };
    distanceAlongRouteM += lengthM;
    return [segment];
  });
  const overlappingSegments = new Set<number>();

  for (let firstIndex = 0; firstIndex < segments.length; firstIndex += 1) {
    const first = segments[firstIndex]!;
    for (let secondIndex = firstIndex + 1; secondIndex < segments.length; secondIndex += 1) {
      const second = segments[secondIndex]!;
      if (second.distanceAlongRouteM - first.distanceAlongRouteM < MIN_ALONG_ROUTE_SEPARATION_M) continue;
      if (Math.hypot(
        second.midpoint[0] - first.midpoint[0],
        second.midpoint[1] - first.midpoint[1]
      ) > REVERSE_OVERLAP_DISTANCE_M) continue;
      const directionDotProduct = first.unitEast * second.unitEast + first.unitNorth * second.unitNorth;
      if (directionDotProduct > MAX_REVERSE_DIRECTION_DOT_PRODUCT) continue;
      overlappingSegments.add(firstIndex);
      overlappingSegments.add(secondIndex);
    }
  }

  const reverseOverlapM = Array.from(overlappingSegments).reduce(
    (total, index) => total + segments[index]!.lengthM,
    0
  );
  return reverseOverlapM > Math.max(MIN_REVERSE_OVERLAP_M, routeDistanceM * 0.06);
}

function toLocalMetres(line: Coordinate[], origin: Coordinate): Coordinate[] {
  const meanLatitudeRadians = origin[1] * Math.PI / 180;
  const metresPerLongitudeDegree = 111_320 * Math.cos(meanLatitudeRadians);
  return line.map(([lng, lat]) => [
    (lng - origin[0]) * metresPerLongitudeDegree,
    (lat - origin[1]) * 110_540
  ]);
}
