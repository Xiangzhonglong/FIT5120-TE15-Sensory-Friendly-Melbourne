import type { FormEvent } from "react";

type Props = {
  destination: string;
  threshold: number;
  busy: boolean;
  onDestinationChange: (value: string) => void;
  onThresholdChange: (value: number) => void;
  onSubmit: () => void;
};

function toleranceLabel(threshold: number): string {
  if (threshold <= 0.45) return "Quiet focus";
  if (threshold <= 0.7) return "Balanced";
  return "More flexible";
}

export function SearchPanel({
  destination,
  threshold,
  busy,
  onDestinationChange,
  onThresholdChange,
  onSubmit
}: Props) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="search-panel" onSubmit={submit} aria-labelledby="plan-heading">
      <div className="search-heading">
        <span className="step-number" aria-hidden="true">01</span>
        <div><div className="section-kicker">Your walk</div><h2 id="plan-heading">Plan a calmer route</h2></div>
      </div>
      <p className="section-copy">Choose where you are going and how much pedestrian activity feels manageable today.</p>

      <label htmlFor="origin">Starting point</label>
      <div className="input-with-icon">
        <span className="field-icon start-icon" aria-hidden="true" />
        <input id="origin" value="Melbourne Town Hall" readOnly aria-describedby="origin-note" />
      </div>
      <span className="field-note" id="origin-note">Demo origin · the API keeps the origin interface ready for live location.</span>

      <label htmlFor="destination">Destination in Melbourne CBD</label>
      <div className="input-with-icon">
        <span className="field-icon destination-icon" aria-hidden="true" />
        <select
          id="destination"
          value={destination}
          onChange={(event) => onDestinationChange(event.target.value)}
        >
          <option>Melbourne Central</option>
          <option>State Library Victoria</option>
          <option>Flinders Street Station</option>
        </select>
      </div>

      <div className="preference-block">
        <div className="range-label">
          <label htmlFor="crowd-threshold">Crowd tolerance</label>
          <output htmlFor="crowd-threshold"><strong>{toleranceLabel(threshold)}</strong><span>{Math.round(threshold * 100)}%</span></output>
        </div>
        <input
          id="crowd-threshold"
          type="range"
          min="0.25"
          max="0.9"
          step="0.05"
          value={threshold}
          aria-valuetext={`${toleranceLabel(threshold)}, ${Math.round(threshold * 100)} percent`}
          onChange={(event) => onThresholdChange(Number(event.target.value))}
        />
        <div className="range-scale" aria-hidden="true"><span>Quieter</span><span>Balanced</span><span>Flexible</span></div>
        <p><span aria-hidden="true">◇</span> We will warn you when a route rises above this level.</p>
      </div>

      <button className="primary-button" type="submit" disabled={busy}>
        <span>{busy ? "Comparing routes…" : "Compare sensory-aware routes"}</span>
        <span className="button-arrow" aria-hidden="true">→</span>
      </button>
      <p className="privacy-line"><span aria-hidden="true">◌</span> No account. No journey history saved.</p>
    </form>
  );
}
