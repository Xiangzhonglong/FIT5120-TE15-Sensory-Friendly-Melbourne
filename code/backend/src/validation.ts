import type { ApiErrorCode, Coordinates, RouteSearchRequest } from "@sensory-melbourne/contracts";

const MELBOURNE_CBD = {
  minLat: -37.835,
  maxLat: -37.79,
  minLng: 144.93,
  maxLng: 145.0
};

export type ValidationResult =
  | { ok: true; value: RouteSearchRequest }
  | { ok: false; code: ApiErrorCode; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function coordinates(value: unknown): Coordinates | null {
  if (!isRecord(value) || !Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return null;
  const lat = Number(value.lat);
  const lng = Number(value.lng);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function isInsideMelbourneCbd(value: Coordinates): boolean {
  return (
    value.lat >= MELBOURNE_CBD.minLat &&
    value.lat <= MELBOURNE_CBD.maxLat &&
    value.lng >= MELBOURNE_CBD.minLng &&
    value.lng <= MELBOURNE_CBD.maxLng
  );
}

export function validateRouteSearchRequest(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return { ok: false, code: "INVALID_REQUEST", message: "Request body must be a JSON object." };
  }

  const origin = coordinates(value.origin);
  const destination = coordinates(value.destination);
  if (!origin || !destination) {
    return {
      ok: false,
      code: "INVALID_COORDINATES",
      message: "Origin and destination must contain valid latitude and longitude values."
    };
  }

  if (!isInsideMelbourneCbd(destination)) {
    return {
      ok: false,
      code: "DESTINATION_OUTSIDE_CBD",
      message: "Destination must be inside the supported Melbourne CBD area."
    };
  }

  if (typeof value.destinationLabel !== "string") {
    return { ok: false, code: "INVALID_REQUEST", message: "Destination label is required." };
  }
  const destinationLabel = value.destinationLabel.trim();
  if (destinationLabel.length === 0 || destinationLabel.length > 120) {
    return {
      ok: false,
      code: "INVALID_REQUEST",
      message: "Destination label must contain between 1 and 120 characters."
    };
  }

  if (!isRecord(value.preferences) || !Number.isFinite(value.preferences.crowdThreshold)) {
    return { ok: false, code: "INVALID_REQUEST", message: "Crowd threshold is required." };
  }
  const crowdThreshold = Number(value.preferences.crowdThreshold);
  if (crowdThreshold < 0 || crowdThreshold > 1) {
    return {
      ok: false,
      code: "INVALID_CROWD_THRESHOLD",
      message: "Crowd threshold must be between 0 and 1."
    };
  }

  return {
    ok: true,
    value: { origin, destination, destinationLabel, preferences: { crowdThreshold } }
  };
}
