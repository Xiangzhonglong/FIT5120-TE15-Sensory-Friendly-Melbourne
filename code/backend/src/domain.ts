import type { Coordinates, LineGeometry } from "@sensory-melbourne/contracts";

export type PedestrianSensor = {
  id: string;
  name: string;
  location: Coordinates;
  currentCount: number;
  historicalP95: number;
};

export type CandidateRoute = {
  id: string;
  name: string;
  durationMin: number;
  distanceM: number;
  geometry: LineGeometry;
};

export type RouteSearchContext = {
  requestId?: string;
};
