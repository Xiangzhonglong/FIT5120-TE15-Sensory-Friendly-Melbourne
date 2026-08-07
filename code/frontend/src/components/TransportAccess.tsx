import type { TransportAccessPoint } from "@sensory-melbourne/contracts";

function symbol(type: TransportAccessPoint["type"]): string {
  if (type === "TRAIN") return "R";
  if (type === "TRAM") return "T";
  return "B";
}

export function TransportAccess({ points }: { points: TransportAccessPoint[] }) {
  return (
    <section className="transport-access insight-card" aria-labelledby="transport-heading">
      <div className="insight-card-heading">
        <div className="insight-icon transport-symbol" aria-hidden="true">T</div>
        <div><div className="section-kicker">Continue your journey</div><h3 id="transport-heading">Transport access</h3></div>
      </div>
      {points.length > 0 ? (
        <div className="transport-list">
          {points.slice(0, 4).map((point) => (
            <article key={point.id}>
              <span className="transport-type" aria-hidden="true">{symbol(point.type)}</span>
              <div><strong>{point.name}</strong><p>{point.type.toLowerCase()} · {point.distanceFromRouteM} m from route</p></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-insight">
          <span aria-hidden="true">◇</span>
          <div><strong>Access-point connection ready</strong><p>Nearby train, tram and bus stops will appear here when the approved transport source is connected.</p></div>
        </div>
      )}
    </section>
  );
}
