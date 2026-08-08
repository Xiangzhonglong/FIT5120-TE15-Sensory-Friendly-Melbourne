import type { RouteOption, RouteSearchResponse } from "@sensory-melbourne/contracts";

export const calmerRoute: RouteOption = {
  id: "route-calmer",
  name: "Calmer via Russell Street",
  durationMin: 18,
  distanceM: 1410,
  sensoryScore: 0.37,
  sensoryLevel: "MODERATE",
  dataConfidence: "MEDIUM",
  geometry: {
    type: "LineString",
    coordinates: [
      [144.9631, -37.8136],
      [144.9672, -37.8108]
    ]
  },
  reasons: [
    "Pedestrian load is moderate relative to recent historical peaks.",
    "Estimate uses sensors near Russell Street."
  ],
  recommended: true
};

export const directRoute: RouteOption = {
  id: "route-direct",
  name: "Direct via Swanston Street",
  durationMin: 14,
  distanceM: 1080,
  sensoryScore: 0.71,
  sensoryLevel: "HIGH",
  dataConfidence: "HIGH",
  geometry: {
    type: "LineString",
    coordinates: [
      [144.9631, -37.8136],
      [144.9626, -37.8102]
    ]
  },
  reasons: [
    "Pedestrian load is high relative to recent historical peaks.",
    "Estimate uses sensors near Swanston Street."
  ],
  recommended: false
};

export const routeSearchResponse: RouteSearchResponse = {
  routes: [calmerRoute, directRoute],
  alerts: [
    {
      id: "crowd-swanston",
      severity: "HIGH",
      area: "Swanston Street",
      message: "Demonstration crowd estimate is above your tolerance.",
      confidence: "HIGH"
    }
  ],
  quietSpaces: [
    {
      id: "state-library",
      name: "State Library Victoria",
      type: "LIBRARY",
      location: { lat: -37.8098, lng: 144.9652 },
      distanceM: 260,
      sourceLabel: "City of Melbourne Open Data"
    }
  ],
  transportAccess: [],
  generatedAt: "2026-08-08T03:00:00Z",
  dataTimestamp: "2026-08-08T03:00:00Z",
  mode: "MOCK",
  dataSources: {
    routing: {
      source: "test routing",
      mode: "MOCK",
      timestamp: "2026-08-08T03:00:00Z",
      confidence: "MEDIUM",
      stale: false
    },
    pedestrian: {
      source: "test pedestrian",
      mode: "MOCK",
      timestamp: "2026-08-08T03:00:00Z",
      confidence: "MEDIUM",
      stale: false
    },
    quietSpaces: {
      source: "test places",
      mode: "MOCK",
      timestamp: "2026-08-08T03:00:00Z",
      confidence: "LOW",
      stale: false
    },
    transport: {
      source: "test transport",
      mode: "MOCK",
      timestamp: "2026-08-08T03:00:00Z",
      confidence: "LOW",
      stale: false
    }
  }
};
