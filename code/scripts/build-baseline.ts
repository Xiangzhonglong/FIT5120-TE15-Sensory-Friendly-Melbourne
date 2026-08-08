/** Stable key shared by offline baseline tooling and backend adapters. */
export function baselineKey(sensorId: string, weekday: number, hour: number): string {
  return `${sensorId}:${weekday}:${hour}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log([
    "The baseline pipeline is implemented in data/clean_data.py.",
    "It generates data/baseline.json and packaged fallback snapshots from official City of Melbourne data.",
    "Run python data/clean_data.py --help for reproducible input and output options."
  ].join("\n"));
}
