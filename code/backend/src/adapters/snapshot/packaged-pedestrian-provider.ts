import baselineJson from "../../../../data/baseline.json" with { type: "json" };
import sensorJson from "../../../../data/pedestrian-sensors-snapshot.json" with { type: "json" };
import type { PedestrianSensor } from "../../domain.js";
import type { PedestrianProvider } from "../../ports/pedestrian-provider.js";
import type { ProviderResult } from "../../ports/provider-result.js";

type BaselineCell = { median?: number; p95?: number; sampleSize?: number };
type BaselineDocument = {
  generatedAt: string;
  source: string;
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

export class PackagedPedestrianProvider implements PedestrianProvider {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async getCurrentSensors(): Promise<ProviderResult<PedestrianSensor[]>> {
    const baseline = baselineJson as BaselineDocument;
    const sensorDocument = sensorJson as SensorDocument;
    const { weekday, hour } = melbourneTimeParts(this.now());
    const sensors = sensorDocument.sensors.flatMap<PedestrianSensor>((sensor) => {
      const cell = baseline.sensors[sensor.id]?.[String(weekday)]?.[String(hour)];
      if (!cell || !Number.isFinite(cell.median) || !Number.isFinite(cell.p95) || Number(cell.p95) <= 0) {
        return [];
      }
      return [{
        ...sensor,
        currentCount: Number(cell.median),
        historicalP95: Number(cell.p95)
      }];
    });
    if (sensors.length === 0) throw new Error("Packaged pedestrian snapshot has no data for the current time window");
    const timestamp = new Date(baseline.generatedAt).toISOString();
    return {
      data: sensors,
      status: {
        source: `${baseline.source} packaged baseline`,
        mode: "SNAPSHOT",
        timestamp,
        confidence: "MEDIUM",
        stale: this.now().getTime() - Date.parse(timestamp) > 120 * 24 * 60 * 60_000
      }
    };
  }
}
