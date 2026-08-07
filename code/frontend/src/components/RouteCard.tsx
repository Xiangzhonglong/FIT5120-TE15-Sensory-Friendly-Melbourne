import type { RouteOption } from "@sensory-melbourne/contracts";

type Props = {
  route: RouteOption;
  selected: boolean;
  onSelect: () => void;
};

const levelSymbols = { LOW: "○", MODERATE: "△", HIGH: "!" } as const;

export function RouteCard({ route, selected, onSelect }: Props) {
  const score = Math.round(route.sensoryScore * 100);

  return (
    <article className={`route-card ${selected ? "selected" : ""}`} aria-label={`${route.name}, ${route.sensoryLevel} crowd load`}>
      <div className="route-card-topline">
        <span className={`level level-${route.sensoryLevel.toLowerCase()}`}>
          <span aria-hidden="true">{levelSymbols[route.sensoryLevel]}</span>
          {route.sensoryLevel} LOAD
        </span>
        {route.recommended && <span className="recommended"><span aria-hidden="true">✦</span> CalmPath pick</span>}
      </div>
      <h3>{route.name}</h3>
      <div className="route-metrics" aria-label="Route details">
        <span><small>Time</small><strong>{route.durationMin} min</strong></span>
        <span><small>Distance</small><strong>{(route.distanceM / 1000).toFixed(1)} km</strong></span>
        <span><small>Crowd load</small><strong>{score}/100</strong></span>
      </div>
      <div className="score-track" aria-label={`Crowd load score ${score} out of 100`}>
        <span className={`score-fill level-${route.sensoryLevel.toLowerCase()}`} style={{ width: `${score}%` }} />
      </div>
      <ul className="route-reasons">
        {route.reasons.slice(0, 2).map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      <div className="confidence"><span aria-hidden="true">◎</span> {route.dataConfidence.toLowerCase()} data confidence</div>
      <button type="button" className="secondary-button" aria-pressed={selected} onClick={onSelect}>
        {selected ? <><span aria-hidden="true">✓</span> Route selected</> : <>View on map <span aria-hidden="true">→</span></>}
      </button>
    </article>
  );
}
