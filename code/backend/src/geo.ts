import type { Coordinates, LineGeometry } from "@sensory-melbourne/contracts";

const EARTH_RADIUS_M = 6_371_000;

function project(point: Coordinates, referenceLat: number): { x: number; y: number } {
  const latRadians = referenceLat * Math.PI / 180;
  return {
    x: EARTH_RADIUS_M * point.lng * Math.PI / 180 * Math.cos(latRadians),
    y: EARTH_RADIUS_M * point.lat * Math.PI / 180
  };
}

export function haversineDistanceM(a: Coordinates, b: Coordinates): number {
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const deltaLat = (b.lat - a.lat) * Math.PI / 180;
  const deltaLng = (b.lng - a.lng) * Math.PI / 180;
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function distanceToLineM(point: Coordinates, geometry: LineGeometry): number {
  const coordinates = geometry.coordinates;
  if (coordinates.length === 0) return Number.POSITIVE_INFINITY;
  if (coordinates.length === 1) {
    const only = coordinates[0]!;
    return haversineDistanceM(point, { lat: only[1], lng: only[0] });
  }

  const projectedPoint = project(point, point.lat);
  let minimum = Number.POSITIVE_INFINITY;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const startCoordinate = coordinates[index]!;
    const endCoordinate = coordinates[index + 1]!;
    const start = project({ lat: startCoordinate[1], lng: startCoordinate[0] }, point.lat);
    const end = project({ lat: endCoordinate[1], lng: endCoordinate[0] }, point.lat);
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const lengthSquared = deltaX ** 2 + deltaY ** 2;
    const ratio = lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1,
        ((projectedPoint.x - start.x) * deltaX + (projectedPoint.y - start.y) * deltaY)
        / lengthSquared
      ));
    const nearestX = start.x + ratio * deltaX;
    const nearestY = start.y + ratio * deltaY;
    minimum = Math.min(minimum, Math.hypot(projectedPoint.x - nearestX, projectedPoint.y - nearestY));
  }

  return minimum;
}
