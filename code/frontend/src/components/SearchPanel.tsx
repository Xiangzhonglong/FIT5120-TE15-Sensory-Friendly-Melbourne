import type { FormEvent } from "react";

type Props = {
  destination: string;
  threshold: number;
  busy: boolean;
  onDestinationChange: (value: string) => void;
  onThresholdChange: (value: number) => void;
  onSubmit: () => void;
};

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
      <div className="section-kicker">Route preferences</div>
      <h2 id="plan-heading">Plan a calmer walk</h2>
      <p className="section-copy">Choose a destination and your crowd tolerance. No account is required.</p>

      <label htmlFor="destination">Destination in Melbourne CBD</label>
      <select
        id="destination"
        value={destination}
        onChange={(event) => onDestinationChange(event.target.value)}
      >
        <option>Melbourne Central</option>
        <option>State Library Victoria</option>
        <option>Flinders Street Station</option>
      </select>

      <div className="range-label">
        <label htmlFor="crowd-threshold">Crowd tolerance</label>
        <output htmlFor="crowd-threshold">{Math.round(threshold * 100)}%</output>
      </div>
      <input
        id="crowd-threshold"
        type="range"
        min="0.25"
        max="0.9"
        step="0.05"
        value={threshold}
        onChange={(event) => onThresholdChange(Number(event.target.value))}
      />
      <div className="range-scale" aria-hidden="true"><span>Prefer quieter</span><span>More flexible</span></div>

      <button className="primary-button" type="submit" disabled={busy}>
        {busy ? "Checking routes…" : "Find sensory-aware routes"}
      </button>
    </form>
  );
}
