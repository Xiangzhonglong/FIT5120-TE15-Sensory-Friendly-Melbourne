import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { routeSearchResponse } from "../test/fixtures";
import { MapPanel } from "./MapPanel";

const mapboxMocks = vi.hoisted(() => ({
  addControl: vi.fn(),
  addLayer: vi.fn(),
  addSource: vi.fn(),
  fitBounds: vi.fn(),
  mapConstructor: vi.fn(),
  markerAddTo: vi.fn(),
  remove: vi.fn()
}));

vi.mock("mapbox-gl", () => {
  class Map {
    constructor(options: unknown) {
      mapboxMocks.mapConstructor(options);
    }

    addControl = mapboxMocks.addControl;
    addLayer = mapboxMocks.addLayer;
    addSource = mapboxMocks.addSource;
    fitBounds = mapboxMocks.fitBounds;
    remove = mapboxMocks.remove;

    on(_event: string, callback: () => void) {
      callback();
    }
  }

  class LngLatBounds {
    extend() {
      return this;
    }

    isEmpty() {
      return false;
    }
  }

  class Marker {
    setLngLat() {
      return this;
    }

    setPopup() {
      return this;
    }

    addTo() {
      mapboxMocks.markerAddTo();
      return this;
    }
  }

  class Popup {
    setText() {
      return this;
    }
  }

  class NavigationControl {}

  return {
    default: {
      accessToken: "",
      LngLatBounds,
      Map,
      Marker,
      NavigationControl,
      Popup
    }
  };
});

describe("MapPanel", () => {
  const route = routeSearchResponse.routes[0];

  it("uses the schematic map when no browser token is configured", () => {
    render(
      <MapPanel
        route={route}
        quietSpaces={routeSearchResponse.quietSpaces}
        transportAccess={routeSearchResponse.transportAccess}
      />
    );

    expect(screen.getByRole("img", { name: /schematic map/i })).toBeInTheDocument();
    expect(mapboxMocks.mapConstructor).not.toHaveBeenCalled();
  });

  it("initialises the Mapbox renderer without requiring WebGL in jsdom", async () => {
    vi.stubEnv("VITE_MAPBOX_TOKEN", "test-browser-token");

    render(
      <MapPanel
        route={route}
        quietSpaces={routeSearchResponse.quietSpaces}
        transportAccess={routeSearchResponse.transportAccess}
      />
    );

    expect(screen.getByLabelText("Interactive route map")).toBeInTheDocument();
    await waitFor(() => expect(mapboxMocks.mapConstructor).toHaveBeenCalledTimes(1));
    expect(mapboxMocks.addSource).toHaveBeenCalledWith(
      "selected-route",
      expect.objectContaining({ type: "geojson" })
    );
  });
});
