import { useCallback, useEffect, useMemo, useState } from "react";
import type { Coordinates, RouteSearchResponse } from "@sensory-melbourne/contracts";
import { AlertPanel } from "./components/AlertPanel";
import { DataSources } from "./components/DataSources";
import { MapPanel } from "./components/MapPanel";
import { QuietSpaces } from "./components/QuietSpaces";
import { RouteCard } from "./components/RouteCard";
import { SearchPanel } from "./components/SearchPanel";
import { TransportAccess } from "./components/TransportAccess";
import { searchRoutes } from "./services/api";
import { geocodeLocation } from "./services/geocoding";
import {
  DEFAULT_DESTINATION,
  DEFAULT_ORIGIN,
  findLocationSuggestion,
  type LocationChoice
} from "./services/locations";

type LocationDraft = {
  label: string;
  coordinates: Coordinates | null;
};

function locationDraft(choice: LocationChoice): LocationDraft {
  return { label: choice.label, coordinates: choice.coordinates };
}

const dataModeLabels = {
  MOCK: "Demo data",
  SNAPSHOT: "Saved snapshot",
  LIVE: "Live data",
  MIXED: "Mixed sources"
} as const;

export function App() {
  const [origin, setOrigin] = useState<LocationDraft>(() => locationDraft(DEFAULT_ORIGIN));
  const [destination, setDestination] = useState<LocationDraft>(() => locationDraft(DEFAULT_DESTINATION));
  const [threshold, setThreshold] = useState(0.6);
  const [result, setResult] = useState<RouteSearchResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string>();
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || undefined;

  const updateLocation = useCallback((value: string, setter: (draft: LocationDraft) => void) => {
    const suggestion = findLocationSuggestion(value);
    setter({ label: value, coordinates: suggestion?.coordinates ?? null });
  }, []);

  const useCurrentLocation = useCallback(() => {
    setError(undefined);
    if (!navigator.geolocation) {
      setError("Current location is not supported by this browser. Enter an address instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          label: "Current location",
          coordinates: { lat: position.coords.latitude, lng: position.coords.longitude }
        });
        setLocating(false);
      },
      () => {
        setError("We could not access your current location. Check browser permission or enter an address.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);

  const runSearch = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      const [originCoordinates, destinationCoordinates] = await Promise.all([
        origin.coordinates
          ? Promise.resolve(origin.coordinates)
          : geocodeLocation(origin.label, { accessToken: mapboxToken, restrictToCbd: false }),
        destination.coordinates
          ? Promise.resolve(destination.coordinates)
          : geocodeLocation(destination.label, { accessToken: mapboxToken, restrictToCbd: true })
      ]);
      const response = await searchRoutes({
        origin: originCoordinates,
        destination: destinationCoordinates,
        destinationLabel: destination.label.trim(),
        preferences: { crowdThreshold: threshold }
      });
      setResult(response);
      setSelectedRouteId(response.routes.find((route) => route.recommended)?.id ?? response.routes[0]?.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Route search failed.");
    } finally {
      setBusy(false);
    }
  }, [destination, mapboxToken, origin, threshold]);

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
              origin={origin.label}
              destination={destination.label}
              threshold={threshold}
              busy={busy}
              locating={locating}
              originIsCurrentLocation={origin.label === "Current location" && Boolean(origin.coordinates)}
              addressSearchAvailable={Boolean(mapboxToken)}
              onOriginChange={(value) => updateLocation(value, setOrigin)}
              onDestinationChange={(value) => updateLocation(value, setDestination)}
              onThresholdChange={setThreshold}
              onUseCurrentLocation={useCurrentLocation}
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
              <h2>What the data suggests around your route</h2>
            </div>
            <p>Crowd estimates reflect the pedestrian source shown on each card. Historical and demonstration data are not current conditions or forecasts.</p>
          </div>
          <div className="insights-grid">
            <AlertPanel
              alerts={result?.alerts ?? []}
              pedestrianSource={result?.dataSources.pedestrian}
            />
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
