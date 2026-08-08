import { render, screen } from "@testing-library/react";
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
});
