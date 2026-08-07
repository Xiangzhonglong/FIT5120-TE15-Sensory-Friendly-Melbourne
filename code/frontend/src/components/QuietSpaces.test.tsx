import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeSearchResponse } from "../test/fixtures";
import { QuietSpaces } from "./QuietSpaces";

describe("QuietSpaces", () => {
  it("expands and collapses nearby place details", () => {
    render(<QuietSpaces places={routeSearchResponse.quietSpaces} />);

    const showButton = screen.getByRole("button", { name: /show 1 nearby place/i });
    expect(showButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("State Library Victoria")).not.toBeVisible();

    fireEvent.click(showButton);

    expect(screen.getByText("State Library Victoria")).toBeVisible();
    expect(screen.getByText(/library · 260 m away/i)).toBeVisible();
    const hideButton = screen.getByRole("button", { name: /hide nearby places/i });
    expect(hideButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(hideButton);
    expect(screen.getByText("State Library Victoria")).not.toBeVisible();
  });

  it("explains when no nearby places are available", () => {
    render(<QuietSpaces places={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /show 0 nearby places/i }));

    expect(screen.getByText(/No nearby pause spaces were returned/i)).toBeVisible();
  });
});
