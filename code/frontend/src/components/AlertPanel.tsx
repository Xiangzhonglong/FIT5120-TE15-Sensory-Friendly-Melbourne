import type { DataSourceStatus, SensoryAlert, SourceMode } from "@sensory-melbourne/contracts";

type Props = {
  alerts: SensoryAlert[];
  pedestrianSource: DataSourceStatus | undefined;
};

type SourceCopy = {
  heading: string;
  kicker: string;
  badge: string;
  empty: string;
  footnote: string;
};

const sourceCopy: Record<SourceMode, SourceCopy> = {
  LIVE: {
    heading: "Crowd alerts",
    kicker: "Current pedestrian conditions",
    badge: "CURRENT",
    empty: "No current crowd alerts are above your selected tolerance.",
    footnote: "Current alerts compare the latest available pedestrian counts with historical peaks. They are estimates, not guarantees."
  },
  SNAPSHOT: {
    heading: "Crowd estimates",
    kicker: "Historical pedestrian estimate",
    badge: "HISTORICAL ESTIMATE",
    empty: "No historical crowd estimate is above your selected tolerance.",
    footnote: "Historical estimates use saved pedestrian patterns. They do not describe current conditions or predict the next hour."
  },
  MOCK: {
    heading: "Crowd estimates",
    kicker: "Demonstration estimate",
    badge: "DEMO ESTIMATE",
    empty: "No demonstration crowd estimate is above your selected tolerance.",
    footnote: "Demonstration estimates use clearly labelled fixture data. They do not describe current conditions or predict the next hour."
  }
};

export function AlertPanel({ alerts, pedestrianSource }: Props) {
  if (!pedestrianSource) {
    return (
      <section className="alert-panel insight-card" aria-labelledby="alerts-heading">
        <div className="insight-card-heading">
          <div className="insight-icon alert-symbol" aria-hidden="true">!</div>
          <div><div className="section-kicker">Pedestrian load estimate</div><h3 id="alerts-heading">Crowd information</h3></div>
        </div>
        <div className="empty-insight" role="status">
          <span aria-hidden="true">…</span>
          <div><strong>Checking pedestrian data</strong><p>Source and crowd information will appear when the route check finishes.</p></div>
        </div>
      </section>
    );
  }

  const copy = sourceCopy[pedestrianSource.mode];

  return (
    <section className="alert-panel insight-card" aria-labelledby="alerts-heading">
      <div className="insight-card-heading">
        <div className="insight-icon alert-symbol" aria-hidden="true">!</div>
        <div><div className="section-kicker">{copy.kicker}</div><h3 id="alerts-heading">{copy.heading}</h3></div>
      </div>
      {alerts.length === 0 ? (
        <div className="empty-insight" role="status">
          <span className="calm-check" aria-hidden="true">✓</span>
          <div><strong>Within your comfort level</strong><p>{copy.empty}</p></div>
        </div>
      ) : (
        <div className="alert-list">
          {alerts.slice(0, 3).map((alert) => (
            <article key={alert.id} className={`alert-item alert-${alert.severity.toLowerCase()}`}>
              <div className="alert-item-topline">
                <span className={`alert-type ${pedestrianSource.mode.toLowerCase()}`}>{copy.badge}</span>
                <span>{alert.confidence.toLowerCase()} confidence</span>
              </div>
              <strong>{alert.area}</strong>
              <p>{alert.message}</p>
            </article>
          ))}
        </div>
      )}
      <p className="insight-footnote"><span aria-hidden="true">i</span> {copy.footnote}</p>
    </section>
  );
}
