import quietSpaceJson from "../../../../data/quiet-spaces-snapshot.json" with { type: "json" };
import type { QuietSpace } from "@sensory-melbourne/contracts";
import type { CandidateRoute } from "../../domain.js";
import { distanceToLineM } from "../../geo.js";
import type { ProviderResult } from "../../ports/provider-result.js";
import type { QuietSpaceRepository } from "../../ports/quiet-space-repository.js";

type QuietSpaceDocument = {
  generatedAt: string;
  source: string;
  features: Array<Omit<QuietSpace, "distanceM">>;
};

export class PackagedQuietSpaceRepository implements QuietSpaceRepository {
  constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly searchDistanceM = 800,
    private readonly resultLimit = 12
  ) {}

  async findNearRoutes(routes: CandidateRoute[]): Promise<ProviderResult<QuietSpace[]>> {
    const document = quietSpaceJson as QuietSpaceDocument;
    const data = document.features
      .map<QuietSpace>((place) => ({
        ...place,
        distanceM: routes.length === 0
          ? Number.POSITIVE_INFINITY
          : Math.round(Math.min(...routes.map((route) => distanceToLineM(place.location, route.geometry))))
      }))
      .filter((place) => place.distanceM <= this.searchDistanceM)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, this.resultLimit);
    const timestamp = new Date(document.generatedAt).toISOString();
    return {
      data,
      status: {
        source: `${document.source} packaged quiet-space snapshot`,
        mode: "SNAPSHOT",
        timestamp,
        confidence: "MEDIUM",
        stale: this.now().getTime() - Date.parse(timestamp) > 180 * 24 * 60 * 60_000
      }
    };
  }
}
