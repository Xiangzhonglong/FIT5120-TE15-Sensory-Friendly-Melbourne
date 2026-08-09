import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeSearchResponse } from "../test/fixtures";
import { DataSources } from "./DataSources";

describe("DataSources", () => {
  it("shows complete Melbourne dates for the response and each source", () => {
    render(
      <DataSources
        dataSources={routeSearchResponse.dataSources}
        generatedAt={routeSearchResponse.generatedAt}
        mode={routeSearchResponse.mode}
      />
    );

    expect(screen.getByText(/Response generated 8 Aug 2026/i)).toBeInTheDocument();
    expect(screen.getAllByText(/8 Aug 2026/i)).toHaveLength(5);
  });
});
