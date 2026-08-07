import type { RouteSearchRequest } from "@sensory-melbourne/contracts";
import { candidateRoutes } from "../../data/mock-data.js";
import type { RouteProvider } from "../../ports/route-provider.js";
import { mockStatus } from "./mock-status.js";

export class MockRouteProvider implements RouteProvider {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async getWalkingRoutes(_request: RouteSearchRequest) {
    return {
      data: candidateRoutes,
      status: mockStatus("Deterministic route fixture", this.now().toISOString(), "MEDIUM")
    };
  }
}
