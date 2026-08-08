export type Coordinates = {
  lat: number;
  lng: number;
};

export type SensoryLevel = "LOW" | "MODERATE" | "HIGH";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export type SourceMode = "LIVE" | "SNAPSHOT" | "MOCK";
export type ResponseMode = SourceMode | "MIXED";

export type DataSourceStatus = {
  source: string;
  mode: SourceMode;
  timestamp: string;
  confidence: Confidence;
  stale: boolean;
  fallbackReason?: string;
};

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
  dataConfidence: Confidence;
  geometry: LineGeometry;
  reasons: string[];
  recommended: boolean;
};

export type SensoryAlert = {
  id: string;
  severity: SensoryLevel;
  area: string;
  message: string;
  confidence: Confidence;
};

export type QuietSpace = {
  id: string;
  name: string;
  type: "PARK" | "LIBRARY" | "PUBLIC_SPACE";
  location: Coordinates;
  distanceM: number;
  sourceLabel: string;
};

export type TransportAccessPoint = {
  id: string;
  name: string;
  type: "TRAIN" | "TRAM" | "BUS";
  location: Coordinates;
  distanceFromRouteM: number;
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
  transportAccess: TransportAccessPoint[];
  generatedAt: string;
  dataTimestamp: string;
  mode: ResponseMode;
  dataSources: {
    routing: DataSourceStatus;
    pedestrian: DataSourceStatus;
    quietSpaces: DataSourceStatus;
    transport: DataSourceStatus;
  };
};

export type HealthResponse = {
  status: "ok";
  service: string;
  timestamp: string;
};

export type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_REQUEST"
  | "INVALID_CONTENT_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "INVALID_COORDINATES"
  | "DESTINATION_OUTSIDE_CBD"
  | "INVALID_CROWD_THRESHOLD"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_UNAVAILABLE"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
    requestId?: string;
  };
};
