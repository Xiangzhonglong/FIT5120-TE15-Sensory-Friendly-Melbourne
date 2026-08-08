import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  // Component tests run in jsdom, which cannot initialise Mapbox WebGL.
  // Keep the default suite deterministic even when a developer has a token
  // in .env.local; Mapbox-specific tests opt into the token explicitly.
  vi.stubEnv("VITE_MAPBOX_TOKEN", "");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});
