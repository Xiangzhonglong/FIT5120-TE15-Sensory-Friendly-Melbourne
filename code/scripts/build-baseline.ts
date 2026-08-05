/**
 * Architecture placeholder for the offline baseline job.
 *
 * Target output: data/baseline.json keyed by sensor, weekday and hour with
 * median and P95 pedestrian counts. The concrete dataset/API must be locked
 * with mentors before this job is connected to live City of Melbourne data.
 */
export function baselineKey(sensorId: string, weekday: number, hour: number): string {
  return `${sensorId}:${weekday}:${hour}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Baseline pipeline boundary is ready; live dataset adapter is not configured yet.");
}
