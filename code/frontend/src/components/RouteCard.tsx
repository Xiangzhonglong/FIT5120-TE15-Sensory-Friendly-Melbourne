import type { RouteOption } from "@sensory-melbourne/contracts";

type Props = {
  route: RouteOption;
  selected: boolean;
  onSelect: () => void;
};

export function RouteCard({ route, selected, onSelect }: Props) {
  return (
    <article className={`route-card ${selected ? "selected" : ""}`} aria-label={`${route.name}, ${route.sensoryLevel} sensory load`}>
      <div className="route-card-topline">
        <span className={`level level-${route.sensoryLevel.toLowerCase()}`}>
          <span aria-hidden="true">{route.sensoryLevel === "LOW" ? "○" : route.sensoryLevel === "MODERATE" ? "△" : "!"}</span>
          {route.sensoryLevel}
        </span>
        {route.recommended && <span className="recommended">Recommended</span>}
      </div>
      <h3>{route.name}</h3>
      <div className="route-metrics">
        <span><strong>{route.durationMin}</strong> min</span>
        <span><strong>{(route.distanceM / 1000).toFixed(1)}</strong> km</span>
        <span><strong>{Math.round(route.sensoryScore * 100)}</strong> load</span>
      </div>
      <p>{route.reasons[0]}</p>
      <p className="confidence">Data confidence: {route.dataConfidence.toLowerCase()}</p>
      <button type="button" className="secondary-button" aria-pressed={selected} onClick={onSelect}>
        {selected ? "Selected route" : "View this route"}
      </button>
    </article>
  );
}
