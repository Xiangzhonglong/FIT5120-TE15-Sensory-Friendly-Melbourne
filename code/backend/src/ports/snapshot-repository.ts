import type { QuietSpace, RouteSearchRequest, TransportAccessPoint } from "@sensory-melbourne/contracts";
import type { CandidateRoute, PedestrianSensor } from "../domain.js";
import type { ProviderResult } from "./provider-result.js";

export interface SnapshotRepository {
  loadRoutes(request: RouteSearchRequest): Promise<ProviderResult<CandidateRoute[]> | null>;
  loadPedestrianSensors(): Promise<ProviderResult<PedestrianSensor[]> | null>;
  loadQuietSpaces(): Promise<ProviderResult<QuietSpace[]> | null>;
  loadTransportAccess(): Promise<ProviderResult<TransportAccessPoint[]> | null>;
}
