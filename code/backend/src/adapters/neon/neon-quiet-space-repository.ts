import type { QuietSpace } from "@sensory-melbourne/contracts";
import type { CandidateRoute } from "../../domain.js";
import { distanceToLineM } from "../../geo.js";
import type { ProviderResult } from "../../ports/provider-result.js";
import type { QuietSpaceRepository } from "../../ports/quiet-space-repository.js";
import type { DatabaseQuery } from "./query.js";

type QuietSpaceRow = {
  id: string;
  name: string;
  type: QuietSpace["type"];
  latitude: number | string;
  longitude: number | string;
  source_label: string;
  updated_at: string | Date;
};

export class NeonQuietSpaceRepository implements QuietSpaceRepository {
  constructor(
    private readonly query: DatabaseQuery,
    private readonly now: () => Date = () => new Date(),
    private readonly searchDistanceM = 800,
    private readonly resultLimit = 12
  ) {}

  async findNearRoutes(routes: CandidateRoute[]): Promise<ProviderResult<QuietSpace[]>> {
    const rows = await this.query<QuietSpaceRow>(`
      SELECT id, name, type, latitude, longitude, source_label, updated_at
      FROM quiet_space_candidate
      ORDER BY name
    `);
    const candidates = rows.flatMap<QuietSpace & { updatedAt: string }>((row) => {
      const lat = Number(row.latitude);
      const lng = Number(row.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      const distanceM = routes.length === 0
        ? Number.POSITIVE_INFINITY
        : Math.min(...routes.map((route) => distanceToLineM({ lat, lng }, route.geometry)));
      if (distanceM > this.searchDistanceM) return [];
      return [{
        id: row.id,
        name: row.name,
        type: row.type,
        location: { lat, lng },
        distanceM: Math.round(distanceM),
        sourceLabel: row.source_label,
        updatedAt: new Date(row.updated_at).toISOString()
      }];
    }).sort((a, b) => a.distanceM - b.distanceM).slice(0, this.resultLimit);
    const timestamps = candidates.map((candidate) => Date.parse(candidate.updatedAt)).filter(Number.isFinite);
    const timestamp = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : this.now().toISOString();

    return {
      data: candidates.map(({ updatedAt: _updatedAt, ...candidate }) => candidate),
      status: {
        source: "City of Melbourne quiet-space candidates via Neon",
        mode: "SNAPSHOT",
        timestamp,
        confidence: "HIGH",
        stale: this.now().getTime() - Date.parse(timestamp) > 180 * 24 * 60 * 60_000
      }
    };
  }
}
