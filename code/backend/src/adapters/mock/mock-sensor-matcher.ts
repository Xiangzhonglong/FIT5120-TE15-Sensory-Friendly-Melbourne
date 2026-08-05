import { routeSensorIds } from "../../data/mock-data.js";
import type { CandidateRoute, PedestrianSensor } from "../../domain.js";
import type { SensorMatcher } from "../../ports/sensor-matcher.js";

export class MockSensorMatcher implements SensorMatcher {
  matchRoute(route: CandidateRoute, sensors: PedestrianSensor[]): PedestrianSensor[] {
    const ids = new Set(routeSensorIds[route.id] ?? []);
    return sensors.filter((sensor) => ids.has(sensor.id));
  }
}
