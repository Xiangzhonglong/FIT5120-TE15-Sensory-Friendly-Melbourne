import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeSearchResponse } from "./test/fixtures";
import { App } from "./App";

const { searchRoutesMock } = vi.hoisted(() => ({ searchRoutesMock: vi.fn() }));

vi.mock("./services/api", () => ({ searchRoutes: searchRoutesMock }));

describe("App", () => {
  beforeEach(() => {
    searchRoutesMock.mockReset();
    searchRoutesMock.mockResolvedValue(routeSearchResponse);
  });

  it("loads and displays the complete no-login route-planning response", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /find a path that feels lighter/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/destination in melbourne cbd/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Calmer via Russell Street", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Demo data")).toBeInTheDocument();
    expect(screen.getByText("CURRENT")).toBeInTheDocument();
    expect(screen.getByText("NEXT HOUR")).toBeInTheDocument();

    expect(searchRoutesMock).toHaveBeenCalledWith({
      origin: { lat: -37.8136, lng: 144.9631 },
      destination: { lat: -37.8102, lng: 144.9628 },
      destinationLabel: "Melbourne Central",
      preferences: { crowdThreshold: 0.6 }
    });
  });

  it("updates the selected route from the route card", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Direct via Swanston Street", level: 3 });

    fireEvent.click(screen.getByRole("button", { name: /view on map/i }));

    expect(screen.getByRole("button", { name: /route selected/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: /schematic map of direct via swanston street/i })).toBeInTheDocument();
  });

  it("submits the selected destination and crowd threshold", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Calmer via Russell Street", level: 3 });

    fireEvent.change(screen.getByLabelText(/destination in melbourne cbd/i), {
      target: { value: "Flinders Street Station" }
    });
    fireEvent.change(screen.getByRole("slider", { name: /crowd tolerance/i }), {
      target: { value: "0.4" }
    });
    fireEvent.click(screen.getByRole("button", { name: /compare sensory-aware routes/i }));

    await waitFor(() => expect(searchRoutesMock).toHaveBeenCalledTimes(2));
    expect(searchRoutesMock).toHaveBeenLastCalledWith({
      origin: { lat: -37.8136, lng: 144.9631 },
      destination: { lat: -37.8183, lng: 144.9671 },
      destinationLabel: "Flinders Street Station",
      preferences: { crowdThreshold: 0.4 }
    });
  });

  it("shows an accessible error and retries a failed request", async () => {
    searchRoutesMock.mockRejectedValueOnce(new Error("The route service is unavailable."));
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("The route service is unavailable.");

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByRole("heading", { name: "Calmer via Russell Street", level: 3 })).toBeInTheDocument();
    expect(searchRoutesMock).toHaveBeenCalledTimes(2);
  });
});
