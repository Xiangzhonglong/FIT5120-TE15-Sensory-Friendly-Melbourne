import type { PedestrianSensor } from "../../domain.js";
import type { PedestrianProvider } from "../../ports/pedestrian-provider.js";
import type { ProviderResult } from "../../ports/provider-result.js";
import type { DatabaseQuery } from "./query.js";

type PedestrianRow = {
  location_id: number | string;
  sensor_name: string;
  latitude: number | string;
  longitude: number | string;
  current_count: number | string;
  p95_count: number | string;
  live_observed_at: string | Date | null;
  baseline_date: string | Date;
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

function asIso(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date(0).toISOString();
}

export class NeonPedestrianProvider implements PedestrianProvider {
  constructor(
    private readonly query: DatabaseQuery,
    private readonly now: () => Date = () => new Date()
  ) {}

  async getCurrentSensors(): Promise<ProviderResult<PedestrianSensor[]>> {
    const now = this.now();
    const { weekday, hour } = melbourneTimeParts(now);
    const rows = await this.query<PedestrianRow>(`
      WITH baseline AS (
        SELECT
          location_id,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY pedestrian_count) AS median_count,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY pedestrian_count) AS p95_count,
          MAX(sensing_date) AS baseline_date
        FROM pedestrian_count_hourly
        WHERE EXTRACT(ISODOW FROM sensing_date)::int - 1 = $1
          AND hour_of_day = $2
        GROUP BY location_id
      ),
      recent AS (
        SELECT
          location_id,
          SUM(pedestrian_count)::double precision AS current_count,
          MAX(observed_at) AS live_observed_at
        FROM pedestrian_count_minute
        WHERE observed_at >= NOW() - INTERVAL '60 minutes'
        GROUP BY location_id
      )
      SELECT
        sensor.location_id,
        sensor.sensor_description AS sensor_name,
        sensor.latitude,
        sensor.longitude,
        COALESCE(recent.current_count, baseline.median_count)::double precision AS current_count,
        baseline.p95_count::double precision AS p95_count,
        recent.live_observed_at,
        baseline.baseline_date
      FROM pedestrian_sensor sensor
      INNER JOIN baseline ON baseline.location_id = sensor.location_id
      LEFT JOIN recent ON recent.location_id = sensor.location_id
      WHERE sensor.status = 'A' AND baseline.p95_count > 0
    `, [weekday, hour]);
    if (rows.length === 0) throw new Error("Neon contains no usable pedestrian sensor baseline rows");

    const sensors = rows.flatMap<PedestrianSensor>((row) => {
      const lat = Number(row.latitude);
      const lng = Number(row.longitude);
      const currentCount = Number(row.current_count);
      const historicalP95 = Number(row.p95_count);
      if (![lat, lng, currentCount, historicalP95].every(Number.isFinite) || historicalP95 <= 0) return [];
      return [{
        id: String(row.location_id),
        name: row.sensor_name,
        location: { lat, lng },
        currentCount,
        historicalP95
      }];
    });
    if (sensors.length === 0) throw new Error("Neon pedestrian rows failed validation");

    const liveDates = rows
      .map((row) => row.live_observed_at ? new Date(row.live_observed_at) : null)
      .filter((date): date is Date => Boolean(date) && Number.isFinite(date!.getTime()));
    const allLive = liveDates.length === rows.length;
    const timestamp = allLive
      ? new Date(Math.min(...liveDates.map((date) => date.getTime()))).toISOString()
      : asIso(rows.map((row) => row.baseline_date).sort().at(-1)!);
    const stale = now.getTime() - Date.parse(timestamp) > (allLive ? 90 * 60_000 : 120 * 24 * 60 * 60_000);

    return {
      data: sensors,
      status: {
        source: allLive ? "City of Melbourne via Neon" : "City of Melbourne historical baseline via Neon",
        mode: allLive ? "LIVE" : "SNAPSHOT",
        timestamp,
        confidence: allLive ? "HIGH" : "MEDIUM",
        stale
      }
    };
  }
}
