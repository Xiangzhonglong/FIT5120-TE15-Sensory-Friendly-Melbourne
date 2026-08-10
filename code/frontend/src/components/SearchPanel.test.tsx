import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchPanel } from "./SearchPanel";

function renderPanel(overrides: Partial<Parameters<typeof SearchPanel>[0]> = {}) {
  const props = {
    origin: "Melbourne Town Hall",
    destination: "Melbourne Central",
    threshold: 0.6,
    busy: false,
    locating: false,
    originIsCurrentLocation: false,
    addressSearchAvailable: true,
    onOriginChange: vi.fn(),
    onDestinationChange: vi.fn(),
    onThresholdChange: vi.fn(),
    onUseCurrentLocation: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides
  };
  render(<SearchPanel {...props} />);
  return props;
}

describe("SearchPanel", () => {
  it("starts with empty location fields and waits for both locations", () => {
    renderPanel({ origin: "", destination: "" });

    expect(screen.getByLabelText(/^starting point$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^starting point$/i)).toHaveAttribute(
      "placeholder",
      "Enter a starting point"
    );
    expect(screen.getByLabelText(/destination in melbourne cbd/i)).toHaveValue("");
    expect(screen.getByLabelText(/destination in melbourne cbd/i)).toHaveAttribute(
      "placeholder",
      "Enter a Melbourne CBD destination"
    );
    expect(screen.getByRole("button", { name: /compare sensory-aware routes/i })).toBeDisabled();
  });

  it("reports origin, destination and crowd-tolerance changes", () => {
    const props = renderPanel();

    fireEvent.change(screen.getByLabelText(/^starting point$/i), {
      target: { value: "100 Collins Street, Melbourne" }
    });
    fireEvent.change(screen.getByLabelText(/destination in melbourne cbd/i), {
      target: { value: "Federation Square" }
    });
    fireEvent.change(screen.getByRole("slider", { name: /crowd tolerance/i }), {
      target: { value: "0.4" }
    });

    expect(props.onOriginChange).toHaveBeenCalledWith("100 Collins Street, Melbourne");
    expect(props.onDestinationChange).toHaveBeenCalledWith("Federation Square");
    expect(props.onThresholdChange).toHaveBeenCalledWith(0.4);
  });

  it("requests the browser's current location", () => {
    const props = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));

    expect(props.onUseCurrentLocation).toHaveBeenCalledOnce();
  });

  it("submits the route-planning form", () => {
    const props = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /compare sensory-aware routes/i }));

    expect(props.onSubmit).toHaveBeenCalledOnce();
  });

  it("disables repeat submissions while routes are loading", () => {
    renderPanel({ busy: true });

    expect(screen.getByRole("button", { name: /comparing routes/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /use my location/i })).toBeDisabled();
    expect(screen.getByRole("slider", { name: /crowd tolerance/i })).toHaveAttribute(
      "aria-valuetext",
      "Balanced, 60 percent"
    );
  });

  it("explains when custom address search is unavailable", () => {
    renderPanel({ addressSearchAvailable: false });

    expect(screen.getByText(/Custom address search is unavailable/i)).toBeInTheDocument();
  });
});
