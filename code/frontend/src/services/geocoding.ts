import type { Coordinates } from "@sensory-melbourne/contracts";

const MELBOURNE_CBD = {
  minLat: -37.835,
  maxLat: -37.79,
  minLng: 144.93,
  maxLng: 145.0
};

type MapboxFeature = {
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
};

type MapboxGeocodingResponse = {
  features?: MapboxFeature[];
  message?: string;
};

type GeocodeOptions = {
  accessToken: string | undefined;
  restrictToCbd: boolean;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

function isInsideMelbourneCbd(value: Coordinates): boolean {
  return value.lat >= MELBOURNE_CBD.minLat
    && value.lat <= MELBOURNE_CBD.maxLat
    && value.lng >= MELBOURNE_CBD.minLng
    && value.lng <= MELBOURNE_CBD.maxLng;
}

function readCoordinates(feature: MapboxFeature | undefined): Coordinates | undefined {
  const coordinates = feature?.geometry?.coordinates;
  if (feature?.geometry?.type !== "Point" || !Array.isArray(coordinates) || coordinates.length < 2) {
    return undefined;
  }
  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

export async function geocodeLocation(query: string, options: GeocodeOptions): Promise<Coordinates> {
  const searchText = query.trim();
  if (searchText.length === 0) throw new Error("Enter a location before comparing routes.");
  if (!options.accessToken) {
    throw new Error("Custom address search is unavailable in this environment. Choose a suggested location instead.");
  }

  const endpoint = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  endpoint.searchParams.set("q", searchText);
  endpoint.searchParams.set("access_token", options.accessToken);
  endpoint.searchParams.set("autocomplete", "false");
  endpoint.searchParams.set("country", "au");
  endpoint.searchParams.set("language", "en");
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("proximity", "144.9631,-37.8136");
  if (options.restrictToCbd) {
    endpoint.searchParams.set("bbox", "144.93,-37.835,145,-37.79");
  }

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(endpoint, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(options.timeoutMs ?? 6_000)
  });
  const payload = await response.json().catch(() => ({})) as MapboxGeocodingResponse;
  if (!response.ok) {
    throw new Error(payload.message ?? "Address search is temporarily unavailable.");
  }

  const coordinates = readCoordinates(payload.features?.[0]);
  if (!coordinates) {
    throw new Error(`No location matched “${searchText}”. Try a complete street address or a suggested place.`);
  }
  if (options.restrictToCbd && !isInsideMelbourneCbd(coordinates)) {
    throw new Error("Destination must be inside the supported Melbourne CBD area.");
  }
  return coordinates;
}
