import { MockPedestrianProvider } from "./adapters/mock/mock-pedestrian-provider.js";
import { MockQuietSpaceRepository } from "./adapters/mock/mock-quiet-space-repository.js";
import { MockRouteProvider } from "./adapters/mock/mock-route-provider.js";
import { MockSensorMatcher } from "./adapters/mock/mock-sensor-matcher.js";
import { MockTransportRepository } from "./adapters/mock/mock-transport-repository.js";
import { consoleLogger } from "./logging.js";
import type { Logger } from "./ports/logger.js";
import type { PedestrianProvider } from "./ports/pedestrian-provider.js";
import type { QuietSpaceRepository } from "./ports/quiet-space-repository.js";
import type { RouteProvider } from "./ports/route-provider.js";
import type { SensorMatcher } from "./ports/sensor-matcher.js";
import type { TransportRepository } from "./ports/transport-repository.js";
import { RouteService } from "./services/route-service.js";

export type Application = {
  routeService: RouteService;
  pedestrianProvider: PedestrianProvider;
  quietSpaceRepository: QuietSpaceRepository;
  logger: Logger;
};

export type ApplicationOptions = {
  logger?: Logger;
  now?: () => Date;
  routeProvider?: RouteProvider;
  pedestrianProvider?: PedestrianProvider;
  quietSpaceRepository?: QuietSpaceRepository;
  transportRepository?: TransportRepository;
  sensorMatcher?: SensorMatcher;
};

export function createApplication(options: ApplicationOptions = {}): Application {
  const now = options.now ?? (() => new Date());
  const logger = options.logger ?? consoleLogger;
  const routeProvider = options.routeProvider ?? new MockRouteProvider(now);
  const pedestrianProvider = options.pedestrianProvider ?? new MockPedestrianProvider(now);
  const quietSpaceRepository = options.quietSpaceRepository ?? new MockQuietSpaceRepository(now);
  const transportRepository = options.transportRepository ?? new MockTransportRepository(now);
  const sensorMatcher = options.sensorMatcher ?? new MockSensorMatcher();

  return {
    pedestrianProvider,
    quietSpaceRepository,
    logger,
    routeService: new RouteService({
      routeProvider,
      pedestrianProvider,
      sensorMatcher,
      quietSpaceRepository,
      transportRepository,
      logger,
      now
    })
  };
}

export const defaultApplication = createApplication();
