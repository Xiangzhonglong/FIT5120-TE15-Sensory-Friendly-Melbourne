import type { SensoryLevel } from "@sensory-melbourne/contracts";
import type { PedestrianSensor } from "../data/mock-data.js";

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function sensorIntensity(currentCount: number, historicalP95: number): number {
  if (!Number.isFinite(currentCount) || !Number.isFinite(historicalP95) || historicalP95 <= 0) {
    return 0;
  }
  return clamp01(currentCount / historicalP95);
}

export function routeCrowdScore(routeSensors: PedestrianSensor[]): number {
  if (routeSensors.length === 0) return 0;
  const mean = routeSensors.reduce(
    (total, sensor) => total + sensorIntensity(sensor.currentCount, sensor.historicalP95),
    0
  ) / routeSensors.length;
  return Number(mean.toFixed(2));
}

export function classifySensoryLevel(score: number): SensoryLevel {
  if (score < 0.35) return "LOW";
  if (score < 0.7) return "MODERATE";
  return "HIGH";
}

export function explainScore(score: number, routeSensors: PedestrianSensor[]): string[] {
  if (routeSensors.length === 0) {
    return ["Insufficient nearby sensor data; treat this estimate with caution."];
  }
  const level = classifySensoryLevel(score).toLowerCase();
  const areas = routeSensors.map((sensor) => sensor.name).join(" and ");
  return [
    `Pedestrian load is ${level} relative to recent historical peaks.`,
    `Estimate uses sensors near ${areas}; it currently represents crowd load only.`
  ];
}
