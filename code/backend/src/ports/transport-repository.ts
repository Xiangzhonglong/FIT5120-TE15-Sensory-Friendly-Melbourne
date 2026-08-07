import type { TransportAccessPoint } from "@sensory-melbourne/contracts";
import type { CandidateRoute } from "../domain.js";
import type { ProviderResult } from "./provider-result.js";

export interface TransportRepository {
  findNearRoutes(routes: CandidateRoute[]): Promise<ProviderResult<TransportAccessPoint[]>>;
}
