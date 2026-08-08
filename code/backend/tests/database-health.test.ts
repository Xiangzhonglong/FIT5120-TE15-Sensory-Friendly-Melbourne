import { describe, expect, it } from "vitest";
import { handleDatabaseHealth } from "../src/adapters/neon/database-health.js";

describe("database health", () => {
  it("reports a reachable database", async () => {
    const response = await handleDatabaseHealth(async () => {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      database: "reachable"
    });
  });

  it("hides database connection errors", async () => {
    const response = await handleDatabaseHealth(async () => {
      throw new Error("test database error");
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      status: "error",
      database: "unavailable"
    });
  });
});
