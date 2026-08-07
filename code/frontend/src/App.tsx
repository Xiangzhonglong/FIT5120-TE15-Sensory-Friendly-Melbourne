import { useCallback, useEffect, useMemo, useState } from "react";
import type { RouteSearchResponse } from "@sensory-melbourne/contracts";
import { AlertPanel } from "./components/AlertPanel";
import { DataSources } from "./components/DataSources";
import { MapPanel } from "./components/MapPanel";
import { QuietSpaces } from "./components/QuietSpaces";
import { RouteCard } from "./components/RouteCard";
import { SearchPanel } from "./components/SearchPanel";
import { TransportAccess } from "./components/TransportAccess";
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
  MIXED: "Mixed sources"
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

  useEffect(() => {
    void runSearch();
  }, []);

  const selectedRoute = useMemo(
    () => result?.routes.find((route) => route.id === selectedRouteId) ?? result?.routes[0],
    [result, selectedRouteId]
  );

  const dataMode = result ? dataModeLabels[result.mode] : "Checking data";
  const dataTimestamp = result
    ? new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(new Date(result.dataTimestamp))
    : undefined;

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="CalmPath Melbourne home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-copy"><strong>CalmPath</strong><small>Melbourne</small></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#planner">Plan a route</a>
          <a href="#routes">Compare routes</a>
          <a href="#support">Pause nearby</a>
        </nav>
        <div className={`header-status mode-${result?.mode.toLowerCase() ?? "loading"}`}>
          <span aria-hidden="true" /> {dataMode}
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <div className="eyebrow">Sensory-aware walking · Melbourne CBD</div>
            <h1>Find a path that feels <em>lighter.</em></h1>
            <p>Compare walking routes by pedestrian pressure, choose your comfort level, and find a quieter place to pause when you need one.</p>
            <div className="hero-notes" aria-label="CalmPath benefits">
              <span><i aria-hidden="true">✓</i> No sign-in</span>
              <span><i aria-hidden="true">◇</i> Explainable scores</span>
              <span><i aria-hidden="true">◌</i> Your preference stays private</span>
            </div>
          </div>
          <div className="sensory-legend" aria-labelledby="legend-heading">
            <div className="legend-heading-row">
              <div>
                <span className="card-label">Crowd load guide</span>
                <h2 id="legend-heading">Know before you walk</h2>
              </div>
              <span className="legend-mark" aria-hidden="true">⌁</span>
            </div>
            <div className="legend-items">
              <span><i className="legend-shape low" aria-hidden="true">○</i><b>Low</b><small>Lighter foot traffic</small></span>
              <span><i className="legend-shape moderate" aria-hidden="true">△</i><b>Moderate</b><small>Some busy sections</small></span>
              <span><i className="legend-shape high" aria-hidden="true">!</i><b>High</b><small>Heavier crowd pressure</small></span>
            </div>
            <p>Levels use words and shapes as well as colour.</p>
          </div>
        </section>

        <section className="planner-layout" id="planner" aria-label="Route planner">
          <aside>
            <SearchPanel
              destination={destination}
              threshold={threshold}
              busy={busy}
              onDestinationChange={(value) => setDestination(value as keyof typeof destinations)}
              onThresholdChange={setThreshold}
              onSubmit={() => void runSearch()}
            />
          </aside>
          <div className="map-region" aria-labelledby="map-heading">
            <div className="map-heading-row">
              <div>
                <div className="section-kicker">Selected route</div>
                <h2 id="map-heading">{selectedRoute?.name ?? "Melbourne CBD"}</h2>
              </div>
              <div className="map-meta">
                {selectedRoute && <span><strong>{selectedRoute.durationMin}</strong> min · {(selectedRoute.distanceM / 1000).toFixed(1)} km</span>}
                <span className="data-time">{dataMode}{dataTimestamp ? ` · updated ${dataTimestamp}` : ""}</span>
              </div>
            </div>
            <MapPanel
              route={selectedRoute}
              quietSpaces={result?.quietSpaces ?? []}
              transportAccess={result?.transportAccess ?? []}
            />
            <div className="map-footer">
              <div><span className="map-key route" aria-hidden="true" /> Selected route</div>
              <div><span className="map-key quiet" aria-hidden="true">✦</span> Pause spaces</div>
              <div><span className="map-key transport" aria-hidden="true">T</span> Transport access</div>
              <p>Map view supports live Mapbox rendering when a restricted browser token is provided.</p>
            </div>
          </div>
        </section>

        {error && (
          <div className="error-state" role="alert">
            <div><strong>We could not check routes.</strong><span>{error}</span></div>
            <button type="button" onClick={() => void runSearch()}>Try again</button>
          </div>
        )}

        <section className="results-section" id="routes" aria-labelledby="routes-heading" aria-busy={busy}>
          <div className="results-heading">
            <div>
              <div className="section-kicker">Compared by pedestrian pressure</div>
              <h2 id="routes-heading">Choose the pace that suits you</h2>
            </div>
            <p>CalmPath ranks routes against recent historical crowd peaks. The score reflects pedestrian load, not every possible sensory factor.</p>
          </div>
          <div className="route-grid" aria-live="polite">
            {busy && !result
              ? Array.from({ length: 3 }, (_, index) => <div className="route-card route-skeleton" key={index} aria-hidden="true" />)
              : result?.routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    selected={route.id === selectedRouteId}
                    onSelect={() => setSelectedRouteId(route.id)}
                  />
                ))}
          </div>
        </section>

        <section className="support-section" id="support" aria-label="Travel support">
          <div className="support-heading">
            <div>
              <div className="section-kicker">Plan with a little more certainty</div>
              <h2>What is happening around your route</h2>
            </div>
            <p>Alerts are possibilities based on current and historical pedestrian patterns. They are not guarantees.</p>
          </div>
          <div className="insights-grid">
            <AlertPanel alerts={result?.alerts ?? []} />
            <QuietSpaces places={result?.quietSpaces ?? []} />
            <TransportAccess points={result?.transportAccess ?? []} />
          </div>
        </section>

        {result && <DataSources dataSources={result.dataSources} generatedAt={result.generatedAt} mode={result.mode} />}
      </main>

      <footer>
        <div className="footer-inner">
          <div className="footer-brand"><span className="brand-mark" aria-hidden="true"><span /></span><div><strong>CalmPath Melbourne</strong><small>A sensory-aware wayfinding prototype</small></div></div>
          <p>Supporting UN Sustainable Development Goal 11: inclusive, safe, resilient and sustainable cities.</p>
        </div>
      </footer>
    </>
  );
}
