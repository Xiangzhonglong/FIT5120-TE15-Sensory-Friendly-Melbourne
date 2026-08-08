import baselineJson from "../../../../data/baseline.json" with { type: "json" };
import sensorJson from "../../../../data/pedestrian-sensors-snapshot.json" with { type: "json" };
import type { PedestrianSensor } from "../../domain.js";
import type { PedestrianProvider } from "../../ports/pedestrian-provider.js";
import type { ProviderResult } from "../../ports/provider-result.js";

const DATASET_ID = "pedestrian-counting-system-past-hour-counts-per-minute";

type ApiRow = {
  location_id?: number | string;
  current_count?: number | string;
  latest?: string;
};
type ApiResponse = { results?: ApiRow[] };
type BaselineCell = { median?: number; p95?: number };
type BaselineDocument = {
  sensors: Record<string, Record<string, Record<string, BaselineCell>>>;
};
type SensorDocument = {
  sensors: Array<{ id: string; name: string; location: { lat: number; lng: number } }>;
};

function melbourneTimeParts(now: Date): { weekday: number; hour: number } {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23"
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  const weekdays: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return { weekday: weekdays[parts.weekday ?? ""] ?? 0, hour: Number(parts.hour ?? 0) };
}

export class MelbourneOpenDataPedestrianProvider implements PedestrianProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly now: () => Date = () => new Date(),
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = 6_000
  ) {}

  async getCurrentSensors(): Promise<ProviderResult<PedestrianSensor[]>> {
    const now = this.now();
    const root = this.baseUrl.includes("/api/explore/")
      ? this.baseUrl.replace(/\/$/, "")
      : `${this.baseUrl.replace(/\/$/, "")}/api/explore/v2.1/catalog/datasets`;
    const endpoint = new URL(`${root}/${DATASET_ID}/records`);
    endpoint.searchParams.set(
      "select",
      "location_id,sum(total_of_directions) as current_count,max(sensing_datetime) as latest"
    );
    endpoint.searchParams.set("where", `sensing_datetime >= date'${new Date(now.getTime() - 65 * 60_000).toISOString()}'`);
    endpoint.searchParams.set("group_by", "location_id");
    endpoint.searchParams.set("limit", "100");

    const response = await this.fetcher(endpoint, {
      headers: { accept: "application/json", "user-agent": "FIT5120-sensory-backend/1.0" },
      signal: AbortSignal.timeout(this.timeoutMs)
    });
    if (!response.ok) throw new Error(`City of Melbourne API returned HTTP ${response.status}`);
    const payload = await response.json() as ApiResponse;
    if (!Array.isArray(payload.results) || payload.results.length === 0) {
      throw new Error("City of Melbourne API returned no recent pedestrian counts");
    }

    const baseline = baselineJson as BaselineDocument;
    const sensorsById = new Map((sensorJson as SensorDocument).sensors.map((sensor) => [sensor.id, sensor]));
    const { weekday, hour } = melbourneTimeParts(now);
    const timestamps: number[] = [];
    const sensors = payload.results.flatMap<PedestrianSensor>((row) => {
      const id = String(row.location_id ?? "");
      const sensor = sensorsById.get(id);
      const cell = baseline.sensors[id]?.[String(weekday)]?.[String(hour)];
      const currentCount = Number(row.current_count);
      const historicalP95 = Number(cell?.p95);
      const timestamp = Date.parse(row.latest ?? "");
      if (!sensor || !Number.isFinite(currentCount) || !Number.isFinite(historicalP95)
        || historicalP95 <= 0 || !Number.isFinite(timestamp)) return [];
      timestamps.push(timestamp);
      return [{ ...sensor, currentCount, historicalP95 }];
    });
    if (sensors.length === 0 || timestamps.length === 0) {
      throw new Error("City of Melbourne counts could not be matched to packaged sensor baselines");
    }
    const timestamp = new Date(Math.max(...timestamps)).toISOString();
    // The City dataset is a rolling past-hour feed and can legitimately publish
    // behind wall-clock time. Reject data only when it has fallen outside that
    // operational window plus a small ingestion allowance.
    const stale = now.getTime() - Date.parse(timestamp) > 90 * 60_000;
    if (stale) throw new Error(`City of Melbourne recent counts are stale (${timestamp})`);

    return {
      data: sensors,
      status: {
        source: "City of Melbourne Past Hour Pedestrian Counts",
        mode: "LIVE",
        timestamp,
        confidence: "HIGH",
        stale: false
      }
    };
  }
}
