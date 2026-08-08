import type { CandidateRoute, PedestrianSensor } from "../domain.js";
import { distanceToLineM } from "../geo.js";
import type { SensorMatcher } from "../ports/sensor-matcher.js";

export class ProximitySensorMatcher implements SensorMatcher {
  constructor(
    private readonly matchDistanceM = 120,
    private readonly nearestFallbackDistanceM = 350
  ) {}

  matchRoute(route: CandidateRoute, sensors: PedestrianSensor[]): PedestrianSensor[] {
    const ranked = sensors
      .map((sensor) => ({ sensor, distanceM: distanceToLineM(sensor.location, route.geometry) }))
      .sort((a, b) => a.distanceM - b.distanceM);
    const matches = ranked
      .filter((item) => item.distanceM <= this.matchDistanceM)
      .map((item) => item.sensor);
    if (matches.length > 0) return matches;
    const nearest = ranked[0];
    return nearest && nearest.distanceM <= this.nearestFallbackDistanceM ? [nearest.sensor] : [];
  }
}
