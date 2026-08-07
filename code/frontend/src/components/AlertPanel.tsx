import type { SensoryAlert } from "@sensory-melbourne/contracts";

function expectedTime(timestamp?: string): string | undefined {
  if (!timestamp) return undefined;
  return new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

export function AlertPanel({ alerts }: { alerts: SensoryAlert[] }) {
  return (
    <section className="alert-panel insight-card" aria-labelledby="alerts-heading">
      <div className="insight-card-heading">
        <div className="insight-icon alert-symbol" aria-hidden="true">!</div>
        <div><div className="section-kicker">Now + next hour</div><h3 id="alerts-heading">Crowd alerts</h3></div>
      </div>
      {alerts.length === 0 ? (
        <div className="empty-insight" role="status">
          <span className="calm-check" aria-hidden="true">✓</span>
          <div><strong>Within your comfort level</strong><p>No crowd alerts are above your current tolerance.</p></div>
        </div>
      ) : (
        <div className="alert-list">
          {alerts.slice(0, 3).map((alert) => {
            const predicted = alert.id.startsWith("prediction-");
            const time = expectedTime(alert.expectedTime);
            return (
              <article key={alert.id} className={`alert-item alert-${alert.severity.toLowerCase()}`}>
                <div className="alert-item-topline">
                  <span className={`alert-type ${predicted ? "predicted" : "current"}`}>{predicted ? "NEXT HOUR" : "CURRENT"}</span>
                  <span>{alert.confidence.toLowerCase()} confidence{time ? ` · by ${time}` : ""}</span>
                </div>
                <strong>{alert.area}</strong>
                <p>{alert.message}</p>
              </article>
            );
          })}
        </div>
      )}
      <p className="insight-footnote"><span aria-hidden="true">i</span> Predictions use historical patterns and recent conditions, not a black-box model.</p>
    </section>
  );
}
