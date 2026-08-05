import type { Coordinates, QuietSpace } from "@sensory-melbourne/contracts";

export type PedestrianSensor = {
  id: string;
  name: string;
  location: Coordinates;
  currentCount: number;
  historicalP95: number;
};

export type CandidateRoute = {
  id: string;
  name: string;
  durationMin: number;
  distanceM: number;
  sensorIds: string[];
  coordinates: [number, number][];
};

export const sensors: PedestrianSensor[] = [
  {
    id: "sensor-swanston",
    name: "Swanston Street",
    location: { lat: -37.8127, lng: 144.9631 },
    currentCount: 720,
    historicalP95: 840
  },
  {
    id: "sensor-russell",
    name: "Russell Street",
    location: { lat: -37.8114, lng: 144.9672 },
    currentCount: 280,
    historicalP95: 760
  },
  {
    id: "sensor-lonsdale",
    name: "Lonsdale Street",
    location: { lat: -37.811, lng: 144.9617 },
    currentCount: 440,
    historicalP95: 790
  }
];

export const candidateRoutes: CandidateRoute[] = [
  {
    id: "route-direct",
    name: "Direct via Swanston Street",
    durationMin: 14,
    distanceM: 1080,
    sensorIds: ["sensor-swanston", "sensor-lonsdale"],
    coordinates: [
      [144.9631, -37.8136],
      [144.963, -37.8124],
      [144.9626, -37.8102]
    ]
  },
  {
    id: "route-calmer",
    name: "Calmer via Russell Street",
    durationMin: 18,
    distanceM: 1410,
    sensorIds: ["sensor-russell"],
    coordinates: [
      [144.9631, -37.8136],
      [144.9671, -37.8126],
      [144.9672, -37.8108],
      [144.9626, -37.8102]
    ]
  },
  {
    id: "route-balanced",
    name: "Balanced via Lonsdale Street",
    durationMin: 16,
    distanceM: 1260,
    sensorIds: ["sensor-lonsdale", "sensor-russell"],
    coordinates: [
      [144.9631, -37.8136],
      [144.9656, -37.812],
      [144.9626, -37.8102]
    ]
  }
];

export const quietSpaces: QuietSpace[] = [
  {
    id: "state-library",
    name: "State Library Victoria",
    type: "LIBRARY",
    location: { lat: -37.8098, lng: 144.9652 },
    distanceM: 260,
    sourceLabel: "Curated demo snapshot - validate before live use"
  },
  {
    id: "flagstaff-gardens",
    name: "Flagstaff Gardens",
    type: "PARK",
    location: { lat: -37.8107, lng: 144.9547 },
    distanceM: 820,
    sourceLabel: "Curated demo snapshot - validate before live use"
  },
  {
    id: "city-library",
    name: "City Library",
    type: "LIBRARY",
    location: { lat: -37.8151, lng: 144.965 },
    distanceM: 540,
    sourceLabel: "Curated demo snapshot - validate before live use"
  }
];
