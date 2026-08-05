import type {
  RouteOption,
  RouteSearchRequest,
  RouteSearchResponse,
  SensoryAlert
} from "@sensory-melbourne/contracts";
import { candidateRoutes, quietSpaces, sensors } from "../data/mock-data.js";
import { createPredictedAlert } from "./prediction.js";
import { classifySensoryLevel, explainScore, routeCrowdScore } from "./scoring.js";

export function searchRoutes(request: RouteSearchRequest, now = new Date()): RouteSearchResponse {
  const threshold = Math.max(0, Math.min(1, request.preferences.crowdThreshold));

  const routes = candidateRoutes
    .map<RouteOption>((candidate) => {
      const routeSensors = sensors.filter((sensor) => candidate.sensorIds.includes(sensor.id));
      const sensoryScore = routeCrowdScore(routeSensors);
      return {
        id: candidate.id,
        name: candidate.name,
        durationMin: candidate.durationMin,
        distanceM: candidate.distanceM,
        sensoryScore,
        sensoryLevel: classifySensoryLevel(sensoryScore),
        dataConfidence: routeSensors.length >= 2 ? "HIGH" : "MEDIUM",
        geometry: { type: "LineString", coordinates: candidate.coordinates },
        reasons: explainScore(sensoryScore, routeSensors),
        recommended: false
      };
    })
    .sort((a, b) => a.sensoryScore - b.sensoryScore || a.durationMin - b.durationMin);

  const withinThreshold = routes.find((route) => route.sensoryScore <= threshold) ?? routes[0];
  if (withinThreshold) withinThreshold.recommended = true;

  const alerts: SensoryAlert[] = sensors
    .filter((sensor) => sensor.currentCount / sensor.historicalP95 > threshold)
    .map((sensor) => ({
      id: `live-${sensor.id}`,
      severity: classifySensoryLevel(sensor.currentCount / sensor.historicalP95),
      area: sensor.name,
      message: `Crowd level is above your ${Math.round(threshold * 100)}% tolerance. View a calmer route.`,
      confidence: "HIGH"
    }));

  const prediction = createPredictedAlert(sensors[0]!, threshold, now);
  if (prediction) alerts.push(prediction);

  return {
    routes,
    alerts,
    quietSpaces,
    generatedAt: now.toISOString(),
    dataTimestamp: now.toISOString(),
    mode: "MOCK"
  };
}
