import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeSearchResponse } from "../test/fixtures";
import { AlertPanel } from "./AlertPanel";

describe("AlertPanel", () => {
  it("distinguishes current alerts from next-hour predictions", () => {
    render(<AlertPanel alerts={routeSearchResponse.alerts} />);

    expect(screen.getByText("CURRENT")).toBeInTheDocument();
    expect(screen.getByText("NEXT HOUR")).toBeInTheDocument();
    expect(screen.getByText(/Crowd level is above your tolerance/i)).toBeInTheDocument();
    expect(screen.getByText(/may become busier within the next hour/i)).toBeInTheDocument();
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/medium confidence/i)).toBeInTheDocument();
  });

  it("shows a calm status when no alerts exceed the threshold", () => {
    render(<AlertPanel alerts={[]} />);

    expect(screen.getByRole("status")).toHaveTextContent("Within your comfort level");
    expect(screen.getByText(/No crowd alerts are above your current tolerance/i)).toBeInTheDocument();
  });
});
