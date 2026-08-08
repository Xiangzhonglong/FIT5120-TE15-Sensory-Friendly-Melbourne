import { describe, expect, it } from "vitest";
import { handleVercelRequest } from "../src/vercel.js";

describe("Vercel Function adapter", () => {
  it("forwards a route request to the existing backend", async () => {
    const request = new Request("https://calmpath.test/api/routes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-vercel-id": "vercel-adapter-test"
      },
      body: JSON.stringify({
        origin: { lat: -37.8136, lng: 144.9631 },
        destination: { lat: -37.8102, lng: 144.9628 },
        destinationLabel: "Melbourne Central",
        preferences: { crowdThreshold: 0.6 }
      })
    });

    const response = await handleVercelRequest(request);
    const payload = await response.json() as {
      mode: string;
      routes: unknown[];
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(payload.mode).toBe("MIXED");
    expect(payload.routes).toHaveLength(3);
  });
});
