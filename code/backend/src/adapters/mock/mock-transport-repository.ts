import { transportAccess } from "../../data/mock-data.js";
import type { CandidateRoute } from "../../domain.js";
import type { TransportRepository } from "../../ports/transport-repository.js";
import { mockStatus } from "./mock-status.js";

export class MockTransportRepository implements TransportRepository {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async findNearRoutes(_routes: CandidateRoute[]) {
    return {
      data: transportAccess,
      status: mockStatus("Transport integration boundary", this.now().toISOString(), "LOW")
    };
  }
}
