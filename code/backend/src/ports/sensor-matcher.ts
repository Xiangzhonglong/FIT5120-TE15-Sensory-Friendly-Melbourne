import type { CandidateRoute, PedestrianSensor } from "../domain.js";

export interface SensorMatcher {
  matchRoute(route: CandidateRoute, sensors: PedestrianSensor[]): PedestrianSensor[];
}
