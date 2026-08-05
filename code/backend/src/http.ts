import type { ApiError, HealthResponse, RouteSearchRequest } from "@sensory-melbourne/contracts";
import { quietSpaces, sensors } from "./data/mock-data.js";
import { searchRoutes } from "./services/route-service.js";
import { classifySensoryLevel, sensorIntensity } from "./services/scoring.js";
import type { HttpApiEvent, HttpResult } from "./types.js";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS"
};

function json(statusCode: number, value: unknown): HttpResult {
  return { statusCode, headers, body: JSON.stringify(value) };
}

function apiError(statusCode: number, code: string, message: string, requestId?: string): HttpResult {
  const error: ApiError = { error: { code, message, ...(requestId ? { requestId } : {}) } };
  return json(statusCode, error);
}

function isRouteRequest(value: unknown): value is RouteSearchRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<RouteSearchRequest>;
  return Boolean(
    request.origin &&
      Number.isFinite(request.origin.lat) &&
      Number.isFinite(request.origin.lng) &&
      request.destination &&
      Number.isFinite(request.destination.lat) &&
      Number.isFinite(request.destination.lng) &&
      typeof request.destinationLabel === "string" &&
      request.preferences &&
      Number.isFinite(request.preferences.crowdThreshold)
  );
}

export async function routeRequest(event: HttpApiEvent): Promise<HttpResult> {
  const method = event.requestContext.http.method.toUpperCase();
  const path = event.rawPath ?? event.requestContext.http.path;
  const requestId = event.requestContext.requestId;

  if (method === "OPTIONS") return { statusCode: 204, headers, body: "" };

  if (method === "GET" && path.endsWith("/health")) {
    const response: HealthResponse = {
      status: "ok",
      service: "sensory-melbourne-api",
      timestamp: new Date().toISOString()
    };
    return json(200, response);
  }

  if (method === "POST" && path.endsWith("/routes")) {
    try {
      const body: unknown = JSON.parse(event.body ?? "null");
      if (!isRouteRequest(body)) {
        return apiError(400, "INVALID_REQUEST", "Origin, destination and crowd threshold are required.", requestId);
      }
      return json(200, searchRoutes(body));
    } catch {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON.", requestId);
    }
  }

  if (method === "GET" && path.endsWith("/crowd")) {
    return json(200, {
      hotspots: sensors.map((sensor) => {
        const score = sensorIntensity(sensor.currentCount, sensor.historicalP95);
        return { ...sensor, score, sensoryLevel: classifySensoryLevel(score) };
      }),
      mode: "MOCK"
    });
  }

  if (method === "GET" && path.endsWith("/quiet-spaces")) {
    return json(200, { quietSpaces, mode: "MOCK" });
  }

  if (method === "GET" && path.endsWith("/alerts")) {
    return json(200, { alerts: searchRoutes(defaultRequest()).alerts, mode: "MOCK" });
  }

  return apiError(404, "NOT_FOUND", `No route for ${method} ${path}.`, requestId);
}

function defaultRequest(): RouteSearchRequest {
  return {
    origin: { lat: -37.8136, lng: 144.9631 },
    destination: { lat: -37.8102, lng: 144.9628 },
    destinationLabel: "Melbourne Central",
    preferences: { crowdThreshold: 0.6 }
  };
}
