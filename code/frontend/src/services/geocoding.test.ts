import { describe, expect, it, vi } from "vitest";
import { geocodeLocation } from "./geocoding";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("geocodeLocation", () => {
  it("uses Mapbox v6 temporary geocoding and the backend CBD boundary", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      features: [{ geometry: { type: "Point", coordinates: [144.9668, -37.8177] } }]
    }));

    const result = await geocodeLocation("200 Collins Street, Melbourne", {
      accessToken: "pk.test-token",
      restrictToCbd: true,
      fetcher
    });

    expect(result).toEqual({ lat: -37.8177, lng: 144.9668 });
    const requestedUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(requestedUrl.origin + requestedUrl.pathname).toBe("https://api.mapbox.com/search/geocode/v6/forward");
    expect(requestedUrl.searchParams.get("q")).toBe("200 Collins Street, Melbourne");
    expect(requestedUrl.searchParams.get("autocomplete")).toBe("false");
    expect(requestedUrl.searchParams.get("bbox")).toBe("144.93,-37.835,145,-37.79");
  });

  it("does not apply the destination CBD boundary to an origin", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      features: [{ geometry: { type: "Point", coordinates: [144.963, -37.87] } }]
    }));

    await geocodeLocation("South Yarra Station", {
      accessToken: "pk.test-token",
      restrictToCbd: false,
      fetcher
    });

    const requestedUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(requestedUrl.searchParams.has("bbox")).toBe(false);
  });

  it("requires a browser-safe token for custom text", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(geocodeLocation("200 Collins Street", {
      accessToken: undefined,
      restrictToCbd: true,
      fetcher
    })).rejects.toThrow(/Custom address search is unavailable/i);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects unusable or out-of-bound destination results", async () => {
    const noResultFetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ features: [] }));
    const outsideFetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      features: [{ geometry: { type: "Point", coordinates: [145.1, -37.9] } }]
    }));

    await expect(geocodeLocation("Unknown place", {
      accessToken: "pk.test-token",
      restrictToCbd: true,
      fetcher: noResultFetcher
    })).rejects.toThrow(/No location matched/i);
    await expect(geocodeLocation("Outside Melbourne", {
      accessToken: "pk.test-token",
      restrictToCbd: true,
      fetcher: outsideFetcher
    })).rejects.toThrow(/inside the supported Melbourne CBD/i);
  });
});
