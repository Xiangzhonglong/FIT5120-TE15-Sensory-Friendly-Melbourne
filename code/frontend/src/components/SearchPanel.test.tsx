import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchPanel } from "./SearchPanel";

function renderPanel(overrides: Partial<Parameters<typeof SearchPanel>[0]> = {}) {
  const props = {
    destination: "Melbourne Central",
    threshold: 0.6,
    busy: false,
    onDestinationChange: vi.fn(),
    onThresholdChange: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides
  };
  render(<SearchPanel {...props} />);
  return props;
}

describe("SearchPanel", () => {
  it("reports destination and crowd-tolerance changes", () => {
    const props = renderPanel();

    fireEvent.change(screen.getByLabelText(/destination in melbourne cbd/i), {
      target: { value: "Flinders Street Station" }
    });
    fireEvent.change(screen.getByRole("slider", { name: /crowd tolerance/i }), {
      target: { value: "0.4" }
    });

    expect(props.onDestinationChange).toHaveBeenCalledWith("Flinders Street Station");
    expect(props.onThresholdChange).toHaveBeenCalledWith(0.4);
  });

  it("submits the route-planning form", () => {
    const props = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /compare sensory-aware routes/i }));

    expect(props.onSubmit).toHaveBeenCalledOnce();
  });

  it("disables repeat submissions while routes are loading", () => {
    renderPanel({ busy: true });

    expect(screen.getByRole("button", { name: /comparing routes/i })).toBeDisabled();
    expect(screen.getByRole("slider", { name: /crowd tolerance/i })).toHaveAttribute(
      "aria-valuetext",
      "Balanced, 60 percent"
    );
  });
});
