import { describe, expect, it, vi } from "vitest";
import { MelbourneOpenDataPedestrianProvider } from "../src/adapters/melbourne-open-data/melbourne-pedestrian-provider.js";

describe("City of Melbourne pedestrian provider", () => {
  it("maps recent official counts to packaged sensor baselines", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      results: [{
        location_id: 3,
        current_count: 450,
        latest: "2026-08-08T01:55:00.000Z"
      }]
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const provider = new MelbourneOpenDataPedestrianProvider(
      "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets",
      () => new Date("2026-08-08T02:00:00.000Z"),
      fetcher as typeof fetch
    );

    const result = await provider.getCurrentSensors();

    expect(result.status.mode).toBe("LIVE");
    expect(result.data[0]).toMatchObject({ id: "3", currentCount: 450 });
    expect(result.data[0]!.historicalP95).toBeGreaterThan(0);
    const url = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(url.pathname).toContain("pedestrian-counting-system-past-hour-counts-per-minute");
    expect(url.searchParams.get("group_by")).toBe("location_id");
  });

  it("rejects stale results so configured fallback can continue", async () => {
    const fetcher = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      results: [{ location_id: 3, current_count: 450, latest: "2026-08-08T00:00:00.000Z" }]
    }), { status: 200 }));
    const provider = new MelbourneOpenDataPedestrianProvider(
      "https://data.melbourne.vic.gov.au",
      () => new Date("2026-08-08T02:00:00.000Z"),
      fetcher as typeof fetch
    );
    await expect(provider.getCurrentSensors()).rejects.toThrow(/stale/i);
  });
});
