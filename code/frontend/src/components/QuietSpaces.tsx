import { useState } from "react";
import type { QuietSpace } from "@sensory-melbourne/contracts";

const placeSymbols = { PARK: "♧", LIBRARY: "▤", PUBLIC_SPACE: "◇" } as const;

type Props = {
  places: QuietSpace[];
  selectedPlaceId: string | undefined;
  onSelectPlace: (place: QuietSpace) => void;
  onRouteToPlace: (place: QuietSpace) => void;
};

export function QuietSpaces({ places, selectedPlaceId, onSelectPlace, onRouteToPlace }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="quiet-spaces insight-card" aria-labelledby="quiet-heading">
      <div className="insight-card-heading">
        <div className="insight-icon quiet-symbol" aria-hidden="true">✦</div>
        <div><div className="section-kicker">Pause nearby</div><h3 id="quiet-heading">Lower-stimulation spaces</h3></div>
      </div>
      <p className="insight-copy">Public places that may offer a calmer break. Suitability is not guaranteed and should be user-validated.</p>
      <button className="quiet-toggle" type="button" aria-expanded={expanded} aria-controls="quiet-space-list" onClick={() => setExpanded((value) => !value)}>
        <span>{expanded ? "Hide nearby places" : `Show ${places.length} nearby places`}</span><span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
      <div className="quiet-list" id="quiet-space-list" hidden={!expanded}>
        {places.length > 0 ? places.map((place) => (
          <article className={place.id === selectedPlaceId ? "selected" : undefined} key={place.id}>
            <button
              className="quiet-place-focus"
              type="button"
              aria-label={`Show ${place.name} on map`}
              aria-pressed={place.id === selectedPlaceId}
              onClick={() => onSelectPlace(place)}
            >
              <span className="quiet-icon" aria-hidden="true">{placeSymbols[place.type]}</span>
              <span className="quiet-place-copy"><strong>{place.name}</strong><small>{place.type.replace("_", " ").toLowerCase()} · {place.distanceM} m from route</small></span>
              <span className="place-arrow" aria-hidden="true">◎</span>
            </button>
            <button
              className="quiet-place-route"
              type="button"
              aria-label={`Route to ${place.name}`}
              onClick={() => onRouteToPlace(place)}
            >
              Route here
            </button>
          </article>
        )) : <p className="empty-copy">No nearby pause spaces were returned for this route.</p>}
      </div>
    </section>
  );
}
