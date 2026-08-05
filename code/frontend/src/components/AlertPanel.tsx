import type { SensoryAlert } from "@sensory-melbourne/contracts";

export function AlertPanel({ alerts }: { alerts: SensoryAlert[] }) {
  if (alerts.length === 0) {
    return <p className="calm-status" role="status">No crowd alerts above your current tolerance.</p>;
  }
  return (
    <section className="alert-panel" aria-labelledby="alerts-heading">
      <div>
        <div className="section-kicker">Live + next hour</div>
        <h2 id="alerts-heading">Crowd alerts</h2>
      </div>
      <div className="alert-list">
        {alerts.slice(0, 2).map((alert) => (
          <article key={alert.id} className="alert-item">
            <span className={`alert-icon level-${alert.severity.toLowerCase()}`} aria-hidden="true">!</span>
            <div><strong>{alert.area}</strong><p>{alert.message}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
