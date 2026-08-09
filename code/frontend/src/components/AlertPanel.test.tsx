import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeSearchResponse } from "../test/fixtures";
import { AlertPanel } from "./AlertPanel";

describe("AlertPanel", () => {
  it("labels snapshot alerts as historical estimates", () => {
    render(
      <AlertPanel
        alerts={routeSearchResponse.alerts}
        pedestrianSource={{ ...routeSearchResponse.dataSources.pedestrian, mode: "SNAPSHOT" }}
      />
    );

    expect(screen.getByText("HISTORICAL ESTIMATE")).toBeInTheDocument();
    expect(screen.getByText(/Historical pedestrian estimate/i)).toBeInTheDocument();
    expect(screen.getByText(/do not describe current conditions or predict the next hour/i)).toBeInTheDocument();
    expect(screen.queryByText("CURRENT")).not.toBeInTheDocument();
    expect(screen.queryByText("NEXT HOUR")).not.toBeInTheDocument();
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
  });

  it("labels live alerts as current", () => {
    render(
      <AlertPanel
        alerts={routeSearchResponse.alerts}
        pedestrianSource={{ ...routeSearchResponse.dataSources.pedestrian, mode: "LIVE" }}
      />
    );

    expect(screen.getByText("CURRENT")).toBeInTheDocument();
    expect(screen.getByText(/Current pedestrian conditions/i)).toBeInTheDocument();
  });

  it("labels mock alerts as demonstration estimates", () => {
    render(
      <AlertPanel
        alerts={routeSearchResponse.alerts}
        pedestrianSource={routeSearchResponse.dataSources.pedestrian}
      />
    );

    expect(screen.getByText("DEMO ESTIMATE")).toBeInTheDocument();
    expect(screen.getByText("Demonstration estimate")).toBeInTheDocument();
  });

  it("shows a source-appropriate calm status when no alerts exceed the threshold", () => {
    render(
      <AlertPanel
        alerts={[]}
        pedestrianSource={{ ...routeSearchResponse.dataSources.pedestrian, mode: "SNAPSHOT" }}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Within your comfort level");
    expect(screen.getByText(/No historical crowd estimate is above your selected tolerance/i)).toBeInTheDocument();
  });

  it("does not claim a comfort result before the source loads", () => {
    render(<AlertPanel alerts={[]} pedestrianSource={undefined} />);

    expect(screen.getByRole("status")).toHaveTextContent("Checking pedestrian data");
    expect(screen.queryByText("Within your comfort level")).not.toBeInTheDocument();
  });

  it("shows three alerts first and expands to the remaining five on request", () => {
    const alerts = Array.from({ length: 8 }, (_, index) => ({
      ...routeSearchResponse.alerts[0]!,
      id: `crowd-${index + 1}`,
      area: `Crowd area ${index + 1}`
    }));

    render(
      <AlertPanel
        alerts={alerts}
        pedestrianSource={{ ...routeSearchResponse.dataSources.pedestrian, mode: "SNAPSHOT" }}
      />
    );

    expect(screen.getByText("Crowd area 3")).toBeInTheDocument();
    expect(screen.queryByText("Crowd area 4")).not.toBeInTheDocument();

    const expandButton = screen.getByRole("button", { name: /show 5 more alerts/i });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(expandButton);

    expect(screen.getByText("Crowd area 8")).toBeInTheDocument();
    const collapseButton = screen.getByRole("button", { name: /show fewer alerts/i });
    expect(collapseButton).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(collapseButton);

    expect(screen.queryByText("Crowd area 4")).not.toBeInTheDocument();
  });
});
