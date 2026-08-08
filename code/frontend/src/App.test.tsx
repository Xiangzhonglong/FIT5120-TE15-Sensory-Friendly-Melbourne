import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeSearchResponse } from "./test/fixtures";
import { App } from "./App";

const { searchRoutesMock } = vi.hoisted(() => ({ searchRoutesMock: vi.fn() }));
const { geocodeLocationMock } = vi.hoisted(() => ({ geocodeLocationMock: vi.fn() }));

vi.mock("./services/api", () => ({ searchRoutes: searchRoutesMock }));
vi.mock("./services/geocoding", () => ({ geocodeLocation: geocodeLocationMock }));

describe("App", () => {
  beforeEach(() => {
    searchRoutesMock.mockReset();
    searchRoutesMock.mockResolvedValue(routeSearchResponse);
    geocodeLocationMock.mockReset();
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
  });

  it("loads and displays the complete no-login route-planning response", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /find a path that feels lighter/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/destination in melbourne cbd/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Calmer via Russell Street", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Demo data")).toBeInTheDocument();
    expect(screen.getByText("DEMO ESTIMATE")).toBeInTheDocument();
    expect(screen.queryByText("CURRENT")).not.toBeInTheDocument();
    expect(screen.queryByText("NEXT HOUR")).not.toBeInTheDocument();
    expect(screen.getByText(/updated 8 Aug 2026/i)).toBeInTheDocument();

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

  it("geocodes custom origin and destination text before searching", async () => {
    geocodeLocationMock.mockImplementation(async (query: string) => query.startsWith("100 Collins")
      ? { lat: -37.8141, lng: 144.9702 }
      : { lat: -37.8177, lng: 144.9668 });
    render(<App />);
    await screen.findByRole("heading", { name: "Calmer via Russell Street", level: 3 });

    fireEvent.change(screen.getByLabelText(/^starting point$/i), {
      target: { value: "100 Collins Street, Melbourne" }
    });
    fireEvent.change(screen.getByLabelText(/destination in melbourne cbd/i), {
      target: { value: "200 Collins Street, Melbourne" }
    });
    fireEvent.click(screen.getByRole("button", { name: /compare sensory-aware routes/i }));

    await waitFor(() => expect(searchRoutesMock).toHaveBeenCalledTimes(2));
    expect(geocodeLocationMock).toHaveBeenNthCalledWith(1, "100 Collins Street, Melbourne", {
      accessToken: undefined,
      restrictToCbd: false
    });
    expect(geocodeLocationMock).toHaveBeenNthCalledWith(2, "200 Collins Street, Melbourne", {
      accessToken: undefined,
      restrictToCbd: true
    });
    expect(searchRoutesMock).toHaveBeenLastCalledWith({
      origin: { lat: -37.8141, lng: 144.9702 },
      destination: { lat: -37.8177, lng: 144.9668 },
      destinationLabel: "200 Collins Street, Melbourne",
      preferences: { crowdThreshold: 0.6 }
    });
  });

  it("uses browser coordinates as the route origin", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => success({
      coords: { latitude: -37.811, longitude: 144.958 }
    } as GeolocationPosition));
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition }
    });
    render(<App />);
    await screen.findByRole("heading", { name: "Calmer via Russell Street", level: 3 });

    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));
    expect(screen.getByLabelText(/^starting point$/i)).toHaveValue("Current location");
    fireEvent.click(screen.getByRole("button", { name: /compare sensory-aware routes/i }));

    await waitFor(() => expect(searchRoutesMock).toHaveBeenCalledTimes(2));
    expect(searchRoutesMock).toHaveBeenLastCalledWith({
      origin: { lat: -37.811, lng: 144.958 },
      destination: { lat: -37.8102, lng: 144.9628 },
      destinationLabel: "Melbourne Central",
      preferences: { crowdThreshold: 0.6 }
    });
  });

  it("focuses a pause space and routes to it only after explicit confirmation", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Calmer via Russell Street", level: 3 });
    fireEvent.click(screen.getByRole("button", { name: /show 1 nearby place/i }));

    const focusButton = screen.getByRole("button", { name: /show state library victoria on map/i });
    fireEvent.click(focusButton);
    expect(focusButton).toHaveAttribute("aria-pressed", "true");
    expect(searchRoutesMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /route to state library victoria/i }));

    await waitFor(() => expect(searchRoutesMock).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText(/destination in melbourne cbd/i)).toHaveValue("State Library Victoria");
    expect(searchRoutesMock).toHaveBeenLastCalledWith({
      origin: { lat: -37.8136, lng: 144.9631 },
      destination: { lat: -37.8098, lng: 144.9652 },
      destinationLabel: "State Library Victoria",
      preferences: { crowdThreshold: 0.6 }
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

  it("uses structured backend errors to show recovery and a support reference", async () => {
    searchRoutesMock.mockRejectedValueOnce(Object.assign(
      new Error("Mapbox did not respond in time."),
      { code: "UPSTREAM_TIMEOUT", status: 504, requestId: "request-123" }
    ));
    render(<App />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Route services are temporarily unavailable.");
    expect(alert).toHaveTextContent("Mapbox did not respond in time.");
    expect(alert).toHaveTextContent("Reference: request-123");
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("asks users to correct invalid route details without offering a blind retry", async () => {
    searchRoutesMock.mockRejectedValueOnce(Object.assign(
      new Error("Destination must be inside the supported Melbourne CBD area."),
      { code: "DESTINATION_OUTSIDE_CBD", status: 400, requestId: "request-456" }
    ));
    render(<App />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Check your route details.");
    expect(alert).toHaveTextContent("Reference: request-456");
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });
});
