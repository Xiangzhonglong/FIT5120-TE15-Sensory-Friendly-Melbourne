import type {
  DataSourceStatus,
  ResponseMode,
  RouteOption,
  RouteSearchRequest,
  RouteSearchResponse,
  SensoryAlert,
  SourceMode
} from "@sensory-melbourne/contracts";
import type { Logger } from "../ports/logger.js";
import type { PedestrianProvider } from "../ports/pedestrian-provider.js";
import type { QuietSpaceRepository } from "../ports/quiet-space-repository.js";
import type { RouteProvider } from "../ports/route-provider.js";
import type { SensorMatcher } from "../ports/sensor-matcher.js";
import type { TransportRepository } from "../ports/transport-repository.js";
import type { RouteSearchContext } from "../domain.js";
import { filterRouteCandidates, rankRouteOptions } from "./route-ranking.js";
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

function crowdAlertMessage(mode: SourceMode, threshold: number): string {
  const tolerance = `${Math.round(threshold * 100)}%`;
  if (mode === "LIVE") {
    return `Current crowd level is above your ${tolerance} tolerance. View a calmer route.`;
  }
  if (mode === "SNAPSHOT") {
    return `Historical crowd estimate is above your ${tolerance} tolerance. View a calmer route.`;
  }
  return `Demonstration crowd estimate is above your ${tolerance} tolerance. View a calmer route.`;
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
    const candidates = filterRouteCandidates(routeResult.data);

    const pedestrianResult = await this.dependencies.pedestrianProvider.getCurrentSensors();

    const matchedSensors = new Map<string, ReturnType<SensorMatcher["matchRoute"]>>();
    const scoredRoutes = candidates
      .map<RouteOption>((candidate) => {
        const routeSensors = this.dependencies.sensorMatcher.matchRoute(candidate, pedestrianResult.data);
        matchedSensors.set(candidate.id, routeSensors);
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
      });
    const routes = rankRouteOptions(scoredRoutes, threshold);

    const [quietSpaceResult, transportResult] = await Promise.all([
      this.dependencies.quietSpaceRepository.findNearRoutes(routes),
      this.dependencies.transportRepository.findNearRoutes(routes)
    ]);

    const returnedRouteIds = new Set(routes.map((route) => route.id));
    const relevantSensors = Array.from(new Map(
      Array.from(matchedSensors.entries())
        .filter(([routeId]) => returnedRouteIds.has(routeId))
        .flatMap(([, sensors]) => sensors)
        .map((sensor) => [sensor.id, sensor])
    ).values());
    const alerts: SensoryAlert[] = relevantSensors
      .filter((sensor) => sensor.currentCount / sensor.historicalP95 > threshold)
      .sort((a, b) => b.currentCount / b.historicalP95 - a.currentCount / a.historicalP95)
      .slice(0, 8)
      .map((sensor) => ({
        id: `crowd-${sensor.id}`,
        severity: classifySensoryLevel(sensor.currentCount / sensor.historicalP95),
        area: sensor.name,
        message: crowdAlertMessage(pedestrianResult.status.mode, threshold),
        confidence: pedestrianResult.status.confidence
      }));

    const generatedAt = this.now();

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
