import type { ApiError, ApiErrorCode, HealthResponse, RouteSearchRequest } from "@sensory-melbourne/contracts";
import { defaultApplication, type Application } from "./application.js";
import { ApplicationError } from "./errors.js";
import { classifySensoryLevel, sensorIntensity } from "./services/scoring.js";
import type { HttpApiEvent, HttpResult } from "./types.js";
import { validateRouteSearchRequest } from "./validation.js";

const MAX_REQUEST_BYTES = 16_384;
const ALLOWED_ORIGIN = process.env.APP_ORIGIN ?? "*";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": ALLOWED_ORIGIN,
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS"
};

function json(statusCode: number, value: unknown): HttpResult {
  return { statusCode, headers, body: JSON.stringify(value) };
}

function apiError(
  statusCode: number,
  code: ApiErrorCode,
  message: string,
  requestId?: string
): HttpResult {
  const error: ApiError = { error: { code, message, ...(requestId ? { requestId } : {}) } };
  return json(statusCode, error);
}

function headerValue(event: HttpApiEvent, name: string): string | undefined {
  const entry = Object.entries(event.headers ?? {}).find(([key]) => key.toLowerCase() === name);
  return entry?.[1];
}

export async function routeRequest(
  event: HttpApiEvent,
  application: Application = defaultApplication
): Promise<HttpResult> {
  const startedAt = Date.now();
  const method = event.requestContext.http.method.toUpperCase();
  const path = event.rawPath ?? event.requestContext.http.path;
  const requestId = event.requestContext.requestId;

  const complete = (result: HttpResult): HttpResult => {
    application.logger.info("http_request_completed", {
      requestId,
      method,
      path,
      statusCode: result.statusCode,
      durationMs: Date.now() - startedAt
    });
    return result;
  };

  try {
    if (method === "OPTIONS") return complete({ statusCode: 204, headers, body: "" });

    if (method === "GET" && path.endsWith("/health")) {
      const response: HealthResponse = {
        status: "ok",
        service: "sensory-melbourne-api",
        timestamp: new Date().toISOString()
      };
      return complete(json(200, response));
    }

    if (method === "POST" && path.endsWith("/routes")) {
      const contentType = headerValue(event, "content-type");
      if (contentType && !contentType.toLowerCase().includes("application/json")) {
        return complete(apiError(415, "INVALID_CONTENT_TYPE", "Content-Type must be application/json.", requestId));
      }
      if (Buffer.byteLength(event.body ?? "", "utf8") > MAX_REQUEST_BYTES) {
        return complete(apiError(413, "PAYLOAD_TOO_LARGE", "Request body exceeds the 16 KB limit.", requestId));
      }

      let body: unknown;
      try {
        body = JSON.parse(event.body ?? "null");
      } catch {
        return complete(apiError(400, "INVALID_JSON", "Request body must be valid JSON.", requestId));
      }

      const validation = validateRouteSearchRequest(body);
      if (!validation.ok) {
        return complete(apiError(400, validation.code, validation.message, requestId));
      }
      const result = await application.routeService.search(
        validation.value,
        requestId ? { requestId } : {}
      );
      return complete(json(200, result));
    }

    if (method === "GET" && path.endsWith("/crowd")) {
      const result = await application.pedestrianProvider.getCurrentSensors();
      return complete(json(200, {
        hotspots: result.data
          .map((sensor) => {
            const score = sensorIntensity(sensor.currentCount, sensor.historicalP95);
            return { ...sensor, score, sensoryLevel: classifySensoryLevel(score) };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 20),
        dataSource: result.status
      }));
    }

    if (method === "GET" && path.endsWith("/quiet-spaces")) {
      const result = await application.routeService.search(
        defaultRequest(),
        requestId ? { requestId } : {}
      );
      return complete(json(200, {
        quietSpaces: result.quietSpaces,
        dataSource: result.dataSources.quietSpaces,
        mode: result.mode
      }));
    }

    if (method === "GET" && path.endsWith("/alerts")) {
      const result = await application.routeService.search(
        defaultRequest(),
        requestId ? { requestId } : {}
      );
      return complete(json(200, {
        alerts: result.alerts,
        dataSource: result.dataSources.pedestrian,
        mode: result.mode
      }));
    }

    return complete(apiError(404, "NOT_FOUND", `No route for ${method} ${path}.`, requestId));
  } catch (error) {
    if (error instanceof ApplicationError) {
      application.logger.warn("application_error", { requestId, code: error.code, message: error.message });
      return complete(apiError(error.statusCode, error.code, error.message, requestId));
    }

    application.logger.error("unhandled_error", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return complete(apiError(500, "INTERNAL_ERROR", "An unexpected error occurred.", requestId));
  }
}

function defaultRequest(): RouteSearchRequest {
  return {
    origin: { lat: -37.8136, lng: 144.9631 },
    destination: { lat: -37.8102, lng: 144.9628 },
    destinationLabel: "Melbourne Central",
    preferences: { crowdThreshold: 0.6 }
  };
}
