import type { FormEvent } from "react";
import { LOCATION_SUGGESTIONS } from "../services/locations";

type Props = {
  origin: string;
  destination: string;
  threshold: number;
  busy: boolean;
  locating: boolean;
  originIsCurrentLocation: boolean;
  addressSearchAvailable: boolean;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onThresholdChange: (value: number) => void;
  onUseCurrentLocation: () => void;
  onSubmit: () => void;
};

function toleranceLabel(threshold: number): string {
  if (threshold <= 0.45) return "Quiet focus";
  if (threshold <= 0.7) return "Balanced";
  return "More flexible";
}

export function SearchPanel({
  origin,
  destination,
  threshold,
  busy,
  locating,
  originIsCurrentLocation,
  addressSearchAvailable,
  onOriginChange,
  onDestinationChange,
  onThresholdChange,
  onUseCurrentLocation,
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
        <input
          id="origin"
          list="origin-suggestions"
          value={origin}
          placeholder="Enter a starting point"
          maxLength={120}
          autoComplete="street-address"
          aria-describedby="origin-note"
          onChange={(event) => onOriginChange(event.target.value)}
        />
      </div>
      <div className="location-field-actions">
        <span className={`field-note${originIsCurrentLocation ? " selected-location" : ""}`} id="origin-note">
          {originIsCurrentLocation
            ? "Current location selected for this request."
            : "Enter an Australian address, choose a suggestion, or use your current location."}
        </span>
        <button
          className="location-button"
          type="button"
          disabled={busy || locating}
          onClick={onUseCurrentLocation}
        >
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      <label htmlFor="destination">Destination in Melbourne CBD</label>
      <div className="input-with-icon">
        <span className="field-icon destination-icon" aria-hidden="true" />
        <input
          id="destination"
          list="destination-suggestions"
          value={destination}
          placeholder="Enter a Melbourne CBD destination"
          maxLength={120}
          autoComplete="off"
          aria-describedby="destination-note"
          onChange={(event) => onDestinationChange(event.target.value)}
        />
      </div>
      <span className="field-note" id="destination-note">
        {addressSearchAvailable
          ? "Enter a CBD address or choose a suggestion. Address search runs only when you compare routes."
          : "Choose a suggested CBD location. Custom address search is unavailable in this environment."}
      </span>

      <datalist id="origin-suggestions">
        {LOCATION_SUGGESTIONS.map((location) => <option key={location.label} value={location.label} />)}
      </datalist>
      <datalist id="destination-suggestions">
        {LOCATION_SUGGESTIONS.map((location) => <option key={location.label} value={location.label} />)}
      </datalist>

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

      <button
        className="primary-button"
        type="submit"
        disabled={busy || locating || origin.trim().length === 0 || destination.trim().length === 0}
      >
        <span>{busy ? "Comparing routes…" : "Compare sensory-aware routes"}</span>
        <span className="button-arrow" aria-hidden="true">→</span>
      </button>
      <p className="privacy-line"><span aria-hidden="true">◌</span> No account. Locations are used for this request and are not saved by CalmPath.</p>
    </form>
  );
}
