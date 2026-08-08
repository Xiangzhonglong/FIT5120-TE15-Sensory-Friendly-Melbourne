type RouteSource = {
  source: string;
  mode: "LIVE" | "SNAPSHOT" | "MOCK";
  stale: boolean;
};

type RouteResponse = {
  routes: unknown[];
  mode: "LIVE" | "SNAPSHOT" | "MOCK" | "MIXED";
  dataSources: {
    routing: RouteSource;
    pedestrian: RouteSource;
    quietSpaces: RouteSource;
    transport: RouteSource;
  };
};

export {};

const baseUrl = (process.env.CALMPATH_BASE_URL ?? "https://calmpath-melbourne.vercel.app")
  .replace(/\/$/, "");
const requireLive = process.env.REQUIRE_LIVE === "true";

async function readJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  return response.json();
}

const health = await readJson("/api/health") as { status?: string };
const database = await readJson("/api/db-health") as { status?: string; database?: string };
const routes = await readJson("/api/routes", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    origin: { lat: -37.8136, lng: 144.9631 },
    destination: { lat: -37.8183, lng: 144.9671 },
    destinationLabel: "Flinders Street Station",
    preferences: { crowdThreshold: 0.6 }
  })
}) as RouteResponse;

if (health.status !== "ok" || database.status !== "ok" || database.database !== "reachable") {
  throw new Error("Runtime or database health check failed");
}
if (!Array.isArray(routes.routes) || routes.routes.length === 0) {
  throw new Error("Route API returned no route candidates");
}

const modes = Object.fromEntries(
  Object.entries(routes.dataSources).map(([name, status]) => [name, status.mode])
);
console.log(JSON.stringify({ baseUrl, health: "ok", database: "reachable", routeMode: routes.mode, modes }, null, 2));

if (requireLive && routes.dataSources.routing.mode !== "LIVE") {
  throw new Error("Mapbox routing is not LIVE; check MAPBOX_SERVER_TOKEN and redeploy");
}
if (requireLive && !["LIVE", "SNAPSHOT"].includes(routes.dataSources.pedestrian.mode)) {
  throw new Error("Pedestrian data has fallen through to MOCK");
}
