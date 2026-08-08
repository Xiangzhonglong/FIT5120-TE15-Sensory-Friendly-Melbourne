import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { calmerRoute } from "../test/fixtures";
import { RouteCard } from "./RouteCard";

describe("RouteCard", () => {
  it("shows the route details and a non-colour sensory indicator", () => {
    render(<RouteCard route={calmerRoute} selected={false} onSelect={() => undefined} />);

    expect(screen.getByRole("article", { name: /calmer via russell street, moderate crowd load/i })).toBeInTheDocument();
    expect(screen.getByText("MODERATE LOAD")).toBeInTheDocument();
    expect(screen.getByText("18 min")).toBeInTheDocument();
    expect(screen.getByText("1.4 km")).toBeInTheDocument();
    expect(screen.getByText("37/100")).toBeInTheDocument();
    expect(screen.getByText(/CalmPath pick/i)).toBeInTheDocument();
    expect(screen.getByText(/medium data confidence/i)).toBeInTheDocument();
  });

  it("calls the selection handler when the user chooses the route", () => {
    const onSelect = vi.fn();
    render(<RouteCard route={calmerRoute} selected={false} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /view on map/i }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("exposes the selected state to assistive technology", () => {
    render(<RouteCard route={calmerRoute} selected onSelect={() => undefined} />);

    expect(screen.getByRole("button", { name: /route selected/i })).toHaveAttribute("aria-pressed", "true");
  });
});
