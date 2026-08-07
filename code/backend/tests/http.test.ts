import { describe, expect, it } from "vitest";
import { createApplication } from "../src/application.js";
import { routeRequest } from "../src/http.js";
import { noopLogger } from "../src/logging.js";
import type { HttpApiEvent } from "../src/types.js";

function event(body: string | null, contentType = "application/json"): HttpApiEvent {
  return {
    rawPath: "/api/routes",
    body,
    headers: { "content-type": contentType },
    requestContext: {
      requestId: "http-test",
      http: { method: "POST", path: "/api/routes" }
    }
  };
}

const validBody = JSON.stringify({
  origin: { lat: -37.8136, lng: 144.9631 },
  destination: { lat: -37.8102, lng: 144.9628 },
  destinationLabel: "Melbourne Central",
  preferences: { crowdThreshold: 0.6 }
});

describe("HTTP route boundary", () => {
  const application = createApplication({
    logger: noopLogger,
    now: () => new Date("2026-08-06T00:00:00.000Z")
  });

  it("returns a complete route response for a valid request", async () => {
    const response = await routeRequest(event(validBody), application);
    const payload = JSON.parse(response.body) as { mode: string; routes: unknown[] };

    expect(response.statusCode).toBe(200);
    expect(payload.mode).toBe("MOCK");
    expect(payload.routes).toHaveLength(3);
  });

  it("rejects invalid JSON with a stable error code and request id", async () => {
    const response = await routeRequest(event("{"), application);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      error: { code: "INVALID_JSON", requestId: "http-test" }
    });
  });

  it("rejects destinations outside Melbourne CBD", async () => {
    const body = JSON.stringify({
      origin: { lat: -37.8136, lng: 144.9631 },
      destination: { lat: -33.8688, lng: 151.2093 },
      destinationLabel: "Sydney",
      preferences: { crowdThreshold: 0.6 }
    });
    const response = await routeRequest(event(body), application);
    expect(JSON.parse(response.body).error.code).toBe("DESTINATION_OUTSIDE_CBD");
  });

  it("rejects crowd thresholds outside the supported range", async () => {
    const body = JSON.stringify({
      origin: { lat: -37.8136, lng: 144.9631 },
      destination: { lat: -37.8102, lng: 144.9628 },
      destinationLabel: "Melbourne Central",
      preferences: { crowdThreshold: 1.5 }
    });
    const response = await routeRequest(event(body), application);
    expect(JSON.parse(response.body).error.code).toBe("INVALID_CROWD_THRESHOLD");
  });

  it("requires JSON content for route requests", async () => {
    const response = await routeRequest(event(validBody, "text/plain"), application);
    expect(response.statusCode).toBe(415);
    expect(JSON.parse(response.body).error.code).toBe("INVALID_CONTENT_TYPE");
  });
});
