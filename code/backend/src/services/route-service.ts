import type {
  DataSourceStatus,
  ResponseMode,
  RouteOption,
  RouteSearchRequest,
  RouteSearchResponse,
  SensoryAlert
} from "@sensory-melbourne/contracts";
import type { Logger } from "../ports/logger.js";
import type { PedestrianProvider } from "../ports/pedestrian-provider.js";
import type { QuietSpaceRepository } from "../ports/quiet-space-repository.js";
import type { RouteProvider } from "../ports/route-provider.js";
import type { SensorMatcher } from "../ports/sensor-matcher.js";
import type { TransportRepository } from "../ports/transport-repository.js";
import type { RouteSearchContext } from "../domain.js";
import { createPredictedAlert } from "./prediction.js";
import { classifySensoryLevel, explainScore, routeCrowdScore } from "./scoring.js";

export type RouteServiceDependencies = {
  routeProvider: RouteProvider;
  pedestrianProvider: PedestrianProvider;
  sensorMatcher: SensorMatcher;
  quietSpaceRepository: QuietSpaceRepository;
  transportRepository: TransportRepository;
  logger: Logger;
  now?: () => Date;
};

function overallMode(statuses: DataSourceStatus[]): ResponseMode {
  const modes = new Set(statuses.map((status) => status.mode));
  return modes.size === 1 ? statuses[0]!.mode : "MIXED";
}

function oldestTimestamp(statuses: DataSourceStatus[]): string {
  const timestamps = statuses
    .map((status) => Date.parse(status.timestamp))
    .filter(Number.isFinite);
  return new Date(Math.min(...timestamps)).toISOString();
}

export class RouteService {
  private readonly now: () => Date;

  constructor(private readonly dependencies: RouteServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  async search(
    request: RouteSearchRequest,
    context: RouteSearchContext = {}
  ): Promise<RouteSearchResponse> {
    const startedAt = Date.now();
    const threshold = Math.max(0, Math.min(1, request.preferences.crowdThreshold));
    const routeResult = await this.dependencies.routeProvider.getWalkingRoutes(request);

    const [pedestrianResult, quietSpaceResult, transportResult] = await Promise.all([
      this.dependencies.pedestrianProvider.getCurrentSensors(),
      this.dependencies.quietSpaceRepository.findNearRoutes(routeResult.data),
      this.dependencies.transportRepository.findNearRoutes(routeResult.data)
    ]);

    const routes = routeResult.data
      .map<RouteOption>((candidate) => {
        const routeSensors = this.dependencies.sensorMatcher.matchRoute(candidate, pedestrianResult.data);
        const sensoryScore = routeCrowdScore(routeSensors);
        return {
          id: candidate.id,
          name: candidate.name,
          durationMin: candidate.durationMin,
          distanceM: candidate.distanceM,
          sensoryScore,
          sensoryLevel: classifySensoryLevel(sensoryScore),
          dataConfidence: routeSensors.length >= 2 ? "HIGH" : routeSensors.length === 1 ? "MEDIUM" : "LOW",
          geometry: candidate.geometry,
          reasons: explainScore(sensoryScore, routeSensors),
          recommended: false
        };
      })
      .sort((a, b) => a.sensoryScore - b.sensoryScore || a.durationMin - b.durationMin);

    const withinThreshold = routes.find((route) => route.sensoryScore <= threshold) ?? routes[0];
    if (withinThreshold) withinThreshold.recommended = true;

    const alerts: SensoryAlert[] = pedestrianResult.data
      .filter((sensor) => sensor.currentCount / sensor.historicalP95 > threshold)
      .map((sensor) => ({
        id: `live-${sensor.id}`,
        severity: classifySensoryLevel(sensor.currentCount / sensor.historicalP95),
        area: sensor.name,
        message: `Crowd level is above your ${Math.round(threshold * 100)}% tolerance. View a calmer route.`,
        confidence: pedestrianResult.status.confidence
      }));

    const generatedAt = this.now();
    const firstSensor = pedestrianResult.data[0];
    if (firstSensor) {
      const prediction = createPredictedAlert(firstSensor, threshold, generatedAt);
      if (prediction) alerts.push(prediction);
    }

    const dataSources = {
      routing: routeResult.status,
      pedestrian: pedestrianResult.status,
      quietSpaces: quietSpaceResult.status,
      transport: transportResult.status
    };
    const statuses = Object.values(dataSources);

    this.dependencies.logger.info("route_search_completed", {
      requestId: context.requestId,
      durationMs: Date.now() - startedAt,
      routeCount: routes.length,
      alertCount: alerts.length,
      mode: overallMode(statuses)
    });

    return {
      routes,
      alerts,
      quietSpaces: quietSpaceResult.data,
      transportAccess: transportResult.data,
      generatedAt: generatedAt.toISOString(),
      dataTimestamp: oldestTimestamp(statuses),
      mode: overallMode(statuses),
      dataSources
    };
  }
}
