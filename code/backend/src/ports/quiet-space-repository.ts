import type { QuietSpace } from "@sensory-melbourne/contracts";
import type { CandidateRoute } from "../domain.js";
import type { ProviderResult } from "./provider-result.js";

export interface QuietSpaceRepository {
  findNearRoutes(routes: CandidateRoute[]): Promise<ProviderResult<QuietSpace[]>>;
}
