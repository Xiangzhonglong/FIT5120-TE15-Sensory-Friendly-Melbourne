import type { QuietSpace, RouteSearchRequest } from "@sensory-melbourne/contracts";
import type { CandidateRoute, PedestrianSensor } from "../domain.js";
import type { Logger } from "../ports/logger.js";
import type { PedestrianProvider } from "../ports/pedestrian-provider.js";
import type { ProviderResult } from "../ports/provider-result.js";
import type { QuietSpaceRepository } from "../ports/quiet-space-repository.js";
import type { RouteProvider } from "../ports/route-provider.js";
import { executeWithFallback, type ProviderAttempt } from "./fallback.js";

export class FallbackRouteProvider implements RouteProvider {
  constructor(
    private readonly providers: Array<{ name: string; provider: RouteProvider }>,
    private readonly logger: Logger
  ) {}

  getWalkingRoutes(request: RouteSearchRequest): Promise<ProviderResult<CandidateRoute[]>> {
    const attempts: ProviderAttempt<CandidateRoute[]>[] = this.providers.map(({ name, provider }) => ({
      name,
      execute: () => provider.getWalkingRoutes(request)
    }));
    return executeWithFallback("walking routes", attempts, this.logger);
  }
}

export class FallbackPedestrianProvider implements PedestrianProvider {
  constructor(
    private readonly providers: Array<{ name: string; provider: PedestrianProvider }>,
    private readonly logger: Logger
  ) {}

  getCurrentSensors(): Promise<ProviderResult<PedestrianSensor[]>> {
    const attempts: ProviderAttempt<PedestrianSensor[]>[] = this.providers.map(({ name, provider }) => ({
      name,
      execute: () => provider.getCurrentSensors()
    }));
    return executeWithFallback("pedestrian sensors", attempts, this.logger);
  }
}

export class FallbackQuietSpaceRepository implements QuietSpaceRepository {
  constructor(
    private readonly repositories: Array<{ name: string; repository: QuietSpaceRepository }>,
    private readonly logger: Logger
  ) {}

  findNearRoutes(routes: CandidateRoute[]): Promise<ProviderResult<QuietSpace[]>> {
    const attempts: ProviderAttempt<QuietSpace[]>[] = this.repositories.map(({ name, repository }) => ({
      name,
      execute: () => repository.findNearRoutes(routes)
    }));
    return executeWithFallback("quiet spaces", attempts, this.logger);
  }
}
