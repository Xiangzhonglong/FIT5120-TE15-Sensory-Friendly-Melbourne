import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { routeSearchResponse } from "../test/fixtures";
import { QuietSpaces } from "./QuietSpaces";

describe("QuietSpaces", () => {
  it("expands and collapses nearby place details", () => {
    render(
      <QuietSpaces
        places={routeSearchResponse.quietSpaces}
        selectedPlaceId={undefined}
        onSelectPlace={() => undefined}
        onRouteToPlace={() => undefined}
      />
    );

    const showButton = screen.getByRole("button", { name: /show 1 nearby place/i });
    expect(showButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("State Library Victoria")).not.toBeVisible();

    fireEvent.click(showButton);

    expect(screen.getByText("State Library Victoria")).toBeVisible();
    expect(screen.getByText(/library · 260 m from route/i)).toBeVisible();
    const hideButton = screen.getByRole("button", { name: /hide nearby places/i });
    expect(hideButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(hideButton);
    expect(screen.getByText("State Library Victoria")).not.toBeVisible();
  });

  it("explains when no nearby places are available", () => {
    render(
      <QuietSpaces
        places={[]}
        selectedPlaceId={undefined}
        onSelectPlace={() => undefined}
        onRouteToPlace={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /show 0 nearby places/i }));

    expect(screen.getByText(/No nearby pause spaces were returned/i)).toBeVisible();
  });

  it("focuses a place on the map without routing until requested", () => {
    const onSelectPlace = vi.fn();
    const onRouteToPlace = vi.fn();
    render(
      <QuietSpaces
        places={routeSearchResponse.quietSpaces}
        selectedPlaceId="state-library"
        onSelectPlace={onSelectPlace}
        onRouteToPlace={onRouteToPlace}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /show 1 nearby place/i }));

    const focusButton = screen.getByRole("button", { name: /show state library victoria on map/i });
    expect(focusButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(focusButton);

    expect(onSelectPlace).toHaveBeenCalledWith(routeSearchResponse.quietSpaces[0]);
    expect(onRouteToPlace).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /route to state library victoria/i }));
    expect(onRouteToPlace).toHaveBeenCalledWith(routeSearchResponse.quietSpaces[0]);
  });
});
