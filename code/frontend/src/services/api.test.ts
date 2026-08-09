import { afterEach, describe, expect, it, vi } from "vitest";
import type { RouteSearchRequest } from "@sensory-melbourne/contracts";
import { RouteSearchError, searchRoutes } from "./api";

const request: RouteSearchRequest = {
  origin: { lat: -37.8136, lng: 144.9631 },
  destination: { lat: -37.8102, lng: 144.9628 },
  destinationLabel: "Melbourne Central",
  preferences: { crowdThreshold: 0.6 }
};

describe("searchRoutes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("preserves backend error codes, status and request references", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: "Routing provider is unavailable.",
        requestId: "request-789"
      }
    }), {
      status: 503,
      headers: { "content-type": "application/json" }
    })));

    const error = await searchRoutes(request).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(RouteSearchError);
    expect(error).toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      message: "Routing provider is unavailable.",
      requestId: "request-789",
      status: 503
    });
  });
});
