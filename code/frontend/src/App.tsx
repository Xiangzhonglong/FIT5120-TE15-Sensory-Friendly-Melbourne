import { useCallback, useEffect, useMemo, useState } from "react";
import type { RouteSearchResponse } from "@sensory-melbourne/contracts";
import { AlertPanel } from "./components/AlertPanel";
import { MapPanel } from "./components/MapPanel";
import { QuietSpaces } from "./components/QuietSpaces";
import { RouteCard } from "./components/RouteCard";
import { SearchPanel } from "./components/SearchPanel";
import { searchRoutes } from "./services/api";

const destinations = {
  "Melbourne Central": { lat: -37.8102, lng: 144.9628 },
  "State Library Victoria": { lat: -37.8098, lng: 144.9652 },
  "Flinders Street Station": { lat: -37.8183, lng: 144.9671 }
} as const;

const dataModeLabels = {
  MOCK: "Demo data",
  SNAPSHOT: "Saved snapshot",
  LIVE: "Live data",
  MIXED: "Mixed data sources"
} as const;

export function App() {
  const [destination, setDestination] = useState<keyof typeof destinations>("Melbourne Central");
  const [threshold, setThreshold] = useState(0.6);
  const [result, setResult] = useState<RouteSearchResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const runSearch = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      const response = await searchRoutes({
        origin: { lat: -37.8136, lng: 144.9631 },
        destination: destinations[destination],
        destinationLabel: destination,
        preferences: { crowdThreshold: threshold }
      });
      setResult(response);
      setSelectedRouteId(response.routes.find((route) => route.recommended)?.id ?? response.routes[0]?.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Route search failed.");
    } finally {
      setBusy(false);
    }
  }, [destination, threshold]);

  useEffect(() => { void runSearch(); }, []);

  const selectedRoute = useMemo(
    () => result?.routes.find((route) => route.id === selectedRouteId) ?? result?.routes[0],
    [result, selectedRouteId]
  );

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Sensory-Friendly Melbourne home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Sensory-Friendly Melbourne</span>
        </a>
        <div className="header-status"><span aria-hidden="true" /> Demo data</div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="eyebrow">Melbourne CBD · sensory-aware wayfinding</div>
            <h1>A calmer route is more than the shortest route.</h1>
            <p>Compare walking options using pedestrian-load signals, clear explanations and nearby places to pause.</p>
          </div>
          <div className="privacy-note"><strong>No sign-in.</strong><span>Your crowd preference stays in this browser session.</span></div>
        </section>

        <div className="planner-layout">
          <aside><SearchPanel destination={destination} threshold={threshold} busy={busy} onDestinationChange={(value) => setDestination(value as keyof typeof destinations)} onThresholdChange={setThreshold} onSubmit={() => void runSearch()} /></aside>
          <section className="map-region" aria-labelledby="map-heading">
            <div className="map-heading-row"><div><div className="section-kicker">Selected route</div><h2 id="map-heading">{selectedRoute?.name ?? "Melbourne CBD"}</h2></div><span className="data-time">{result ? dataModeLabels[result.mode] : "Loading data"}</span></div>
            <MapPanel route={selectedRoute} quietSpaces={result?.quietSpaces ?? []} />
          </section>
        </div>

        {error && <div className="error-state" role="alert"><strong>We could not check routes.</strong> {error} Start the local API or try again.</div>}

        <section className="results-section" aria-labelledby="routes-heading" aria-busy={busy}>
          <div className="results-heading"><div><div className="section-kicker">Compared by crowd load</div><h2 id="routes-heading">Route options</h2></div><p>Lower scores indicate lighter pedestrian pressure, not a guarantee of total sensory comfort.</p></div>
          <div className="route-grid">
            {result?.routes.map((route) => <RouteCard key={route.id} route={route} selected={route.id === selectedRouteId} onSelect={() => setSelectedRouteId(route.id)} />)}
          </div>
        </section>

        <div className="insights-grid">
          <AlertPanel alerts={result?.alerts ?? []} />
          <QuietSpaces places={result?.quietSpaces ?? []} />
        </div>
      </main>

      <footer><p>Prototype for UN SDG Goal 11. Crowd scoring is explainable and data-timestamped; additional sensory factors require validated data.</p></footer>
    </>
  );
}
