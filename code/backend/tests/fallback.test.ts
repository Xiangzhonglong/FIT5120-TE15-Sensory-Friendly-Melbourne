import { describe, expect, it } from "vitest";
import { executeWithFallback } from "../src/adapters/fallback.js";
import { ApplicationError } from "../src/errors.js";
import { noopLogger } from "../src/logging.js";

describe("provider fallback", () => {
  it("uses the next provider and records why fallback occurred", async () => {
    const result = await executeWithFallback("route lookup", [
      { name: "live", execute: async () => { throw new Error("timeout"); } },
      {
        name: "snapshot",
        execute: async () => ({
          data: ["snapshot-value"],
          status: {
            source: "versioned snapshot",
            mode: "SNAPSHOT" as const,
            timestamp: "2026-08-06T00:00:00.000Z",
            confidence: "MEDIUM" as const,
            stale: false
          }
        })
      }
    ], noopLogger);

    expect(result.data).toEqual(["snapshot-value"]);
    expect(result.status.mode).toBe("SNAPSHOT");
    expect(result.status.fallbackReason).toContain("live: timeout");
  });

  it("returns a stable application error when every provider fails", async () => {
    await expect(executeWithFallback("route lookup", [
      { name: "live", execute: async () => { throw new Error("offline"); } },
      { name: "snapshot", execute: async () => { throw new Error("missing"); } }
    ], noopLogger)).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      statusCode: 503
    } satisfies Partial<ApplicationError>);
  });
});
