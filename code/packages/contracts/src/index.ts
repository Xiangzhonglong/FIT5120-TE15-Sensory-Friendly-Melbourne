export type Coordinates = {
  lat: number;
  lng: number;
};

export type SensoryLevel = "LOW" | "MODERATE" | "HIGH";

export type LineGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

export type RouteOption = {
  id: string;
  name: string;
  durationMin: number;
  distanceM: number;
  sensoryScore: number;
  sensoryLevel: SensoryLevel;
  dataConfidence: "LOW" | "MEDIUM" | "HIGH";
  geometry: LineGeometry;
  reasons: string[];
  recommended: boolean;
};

export type SensoryAlert = {
  id: string;
  severity: SensoryLevel;
  area: string;
  message: string;
  expectedTime?: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
};

export type QuietSpace = {
  id: string;
  name: string;
  type: "PARK" | "LIBRARY" | "PUBLIC_SPACE";
  location: Coordinates;
  distanceM: number;
  sourceLabel: string;
};

export type RouteSearchRequest = {
  origin: Coordinates;
  destination: Coordinates;
  destinationLabel: string;
  preferences: {
    crowdThreshold: number;
  };
};

export type RouteSearchResponse = {
  routes: RouteOption[];
  alerts: SensoryAlert[];
  quietSpaces: QuietSpace[];
  generatedAt: string;
  dataTimestamp: string;
  mode: "MOCK" | "LIVE";
};

export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};
