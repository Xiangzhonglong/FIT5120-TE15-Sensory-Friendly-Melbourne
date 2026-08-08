import {
  FallbackPedestrianProvider,
  FallbackQuietSpaceRepository,
  FallbackRouteProvider
} from "./adapters/fallback-providers.js";
import { MapboxRouteProvider } from "./adapters/mapbox/mapbox-route-provider.js";
import { MelbourneOpenDataPedestrianProvider } from "./adapters/melbourne-open-data/melbourne-pedestrian-provider.js";
import { MockPedestrianProvider } from "./adapters/mock/mock-pedestrian-provider.js";
import { MockQuietSpaceRepository } from "./adapters/mock/mock-quiet-space-repository.js";
import { MockRouteProvider } from "./adapters/mock/mock-route-provider.js";
import { MockSensorMatcher } from "./adapters/mock/mock-sensor-matcher.js";
import { MockTransportRepository } from "./adapters/mock/mock-transport-repository.js";
import { NeonPedestrianProvider } from "./adapters/neon/neon-pedestrian-provider.js";
import { NeonQuietSpaceRepository } from "./adapters/neon/neon-quiet-space-repository.js";
import { createNeonQuery } from "./adapters/neon/query.js";
import { ProximitySensorMatcher } from "./adapters/proximity-sensor-matcher.js";
import { PackagedPedestrianProvider } from "./adapters/snapshot/packaged-pedestrian-provider.js";
import { PackagedQuietSpaceRepository } from "./adapters/snapshot/packaged-quiet-space-repository.js";
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

export type ConfiguredApplicationOptions = ApplicationOptions & {
  environment?: Record<string, string | undefined>;
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

export function createConfiguredApplication(options: ConfiguredApplicationOptions = {}): Application {
  const environment = options.environment ?? process.env;
  const now = options.now ?? (() => new Date());
  const logger = options.logger ?? consoleLogger;
  const mockRouteProvider = new MockRouteProvider(now);
  const mockPedestrianProvider = new MockPedestrianProvider(now);
  const mockQuietSpaceRepository = new MockQuietSpaceRepository(now);

  const routeProviders: Array<{ name: string; provider: RouteProvider }> = [];
  if (environment.MAPBOX_SERVER_TOKEN) {
    routeProviders.push({
      name: "mapbox-live",
      provider: new MapboxRouteProvider(environment.MAPBOX_SERVER_TOKEN, now)
    });
  }
  routeProviders.push({ name: "route-mock", provider: mockRouteProvider });

  const pedestrianProviders: Array<{ name: string; provider: PedestrianProvider }> = [];
  const quietSpaceRepositories: Array<{ name: string; repository: QuietSpaceRepository }> = [];
  if (environment.LIVE_DATA_ENABLED === "true") {
    pedestrianProviders.push({
      name: "city-of-melbourne-live",
      provider: new MelbourneOpenDataPedestrianProvider(
        environment.MELBOURNE_OPEN_DATA_BASE_URL
          ?? "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets",
        now
      )
    });
  }
  if (environment.DATABASE_URL) {
    const query = createNeonQuery(environment.DATABASE_URL);
    pedestrianProviders.push({
      name: "neon-pedestrian-data",
      provider: new NeonPedestrianProvider(query, now)
    });
    quietSpaceRepositories.push({
      name: "neon-quiet-spaces",
      repository: new NeonQuietSpaceRepository(query, now)
    });
  }
  pedestrianProviders.push(
    { name: "packaged-pedestrian-snapshot", provider: new PackagedPedestrianProvider(now) },
    { name: "pedestrian-mock", provider: mockPedestrianProvider }
  );
  quietSpaceRepositories.push(
    { name: "packaged-quiet-space-snapshot", repository: new PackagedQuietSpaceRepository(now) },
    { name: "quiet-space-mock", repository: mockQuietSpaceRepository }
  );

  return createApplication({
    logger,
    now,
    routeProvider: options.routeProvider ?? new FallbackRouteProvider(routeProviders, logger),
    pedestrianProvider: options.pedestrianProvider
      ?? new FallbackPedestrianProvider(pedestrianProviders, logger),
    quietSpaceRepository: options.quietSpaceRepository
      ?? new FallbackQuietSpaceRepository(quietSpaceRepositories, logger),
    transportRepository: options.transportRepository ?? new MockTransportRepository(now),
    sensorMatcher: options.sensorMatcher ?? new ProximitySensorMatcher()
  });
}

export const defaultApplication = createConfiguredApplication();
