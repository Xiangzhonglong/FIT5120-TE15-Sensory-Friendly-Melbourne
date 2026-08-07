import type { RouteSearchRequest } from "@sensory-melbourne/contracts";
import type { CandidateRoute } from "../domain.js";
import type { ProviderResult } from "./provider-result.js";

export interface RouteProvider {
  getWalkingRoutes(request: RouteSearchRequest): Promise<ProviderResult<CandidateRoute[]>>;
}
