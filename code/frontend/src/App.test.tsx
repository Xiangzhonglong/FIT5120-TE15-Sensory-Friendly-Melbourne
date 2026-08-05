import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./services/api", () => ({
  searchRoutes: vi.fn().mockResolvedValue({
    routes: [], alerts: [], quietSpaces: [], generatedAt: "2026-08-05T00:00:00Z", dataTimestamp: "2026-08-05T00:00:00Z", mode: "MOCK"
  })
}));

describe("App", () => {
  it("exposes the core no-login route planning flow", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /calmer route/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/destination in melbourne cbd/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /sensory-aware routes/i })).toBeInTheDocument();
  });
});
