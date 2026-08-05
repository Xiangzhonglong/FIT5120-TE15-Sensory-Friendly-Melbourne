import type { SensoryAlert } from "@sensory-melbourne/contracts";
import type { PedestrianSensor } from "../data/mock-data.js";
import { classifySensoryLevel, clamp01, sensorIntensity } from "./scoring.js";

export function createPredictedAlert(
  sensor: PedestrianSensor,
  threshold: number,
  now = new Date()
): SensoryAlert | null {
  const current = sensorIntensity(sensor.currentCount, sensor.historicalP95);
  const predicted = clamp01(current * 1.12);
  if (predicted <= threshold) return null;

  const expected = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    id: `prediction-${sensor.id}`,
    severity: classifySensoryLevel(predicted),
    area: sensor.name,
    message: `${sensor.name} is likely to become busier within the next hour.`,
    expectedTime: expected.toISOString(),
    confidence: "MEDIUM"
  };
}
