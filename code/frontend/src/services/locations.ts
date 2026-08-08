import type { Coordinates } from "@sensory-melbourne/contracts";

export type LocationChoice = {
  label: string;
  coordinates: Coordinates;
};

export const LOCATION_SUGGESTIONS: LocationChoice[] = [
  { label: "Melbourne Town Hall", coordinates: { lat: -37.8136, lng: 144.9631 } },
  { label: "Melbourne Central", coordinates: { lat: -37.8102, lng: 144.9628 } },
  { label: "State Library Victoria", coordinates: { lat: -37.8098, lng: 144.9652 } },
  { label: "Flinders Street Station", coordinates: { lat: -37.8183, lng: 144.9671 } },
  { label: "Southern Cross Station", coordinates: { lat: -37.8184, lng: 144.9525 } },
  { label: "Queen Victoria Market", coordinates: { lat: -37.8076, lng: 144.9568 } },
  { label: "Federation Square", coordinates: { lat: -37.8179, lng: 144.969 } },
  { label: "Flagstaff Gardens", coordinates: { lat: -37.8107, lng: 144.9547 } }
];

export const DEFAULT_ORIGIN = LOCATION_SUGGESTIONS[0]!;
export const DEFAULT_DESTINATION = LOCATION_SUGGESTIONS[1]!;

export function findLocationSuggestion(value: string): LocationChoice | undefined {
  const normalised = value.trim().toLocaleLowerCase("en-AU");
  return LOCATION_SUGGESTIONS.find(
    (location) => location.label.toLocaleLowerCase("en-AU") === normalised
  );
}
