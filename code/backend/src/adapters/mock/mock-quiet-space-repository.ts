import { quietSpaces } from "../../data/mock-data.js";
import type { CandidateRoute } from "../../domain.js";
import type { QuietSpaceRepository } from "../../ports/quiet-space-repository.js";
import { mockStatus } from "./mock-status.js";

export class MockQuietSpaceRepository implements QuietSpaceRepository {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async findNearRoutes(_routes: CandidateRoute[]) {
    return {
      data: quietSpaces,
      status: mockStatus("Curated quiet-space demo fixture", this.now().toISOString(), "LOW")
    };
  }
}
