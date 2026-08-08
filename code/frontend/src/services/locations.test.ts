import { describe, expect, it } from "vitest";
import { DEFAULT_DESTINATION, findLocationSuggestion } from "./locations";

describe("location suggestions", () => {
  it("matches suggested places without case sensitivity or surrounding spaces", () => {
    expect(findLocationSuggestion("  melbourne central ")).toEqual(DEFAULT_DESTINATION);
  });

  it("leaves custom addresses unresolved for geocoding", () => {
    expect(findLocationSuggestion("200 Collins Street, Melbourne")).toBeUndefined();
  });
});
