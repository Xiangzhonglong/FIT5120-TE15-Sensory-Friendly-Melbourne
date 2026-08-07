import { useState } from "react";
import type { QuietSpace } from "@sensory-melbourne/contracts";

const placeSymbols = { PARK: "♧", LIBRARY: "▤", PUBLIC_SPACE: "◇" } as const;

export function QuietSpaces({ places }: { places: QuietSpace[] }) {
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
          <article key={place.id}>
            <span className="quiet-icon" aria-hidden="true">{placeSymbols[place.type]}</span>
            <div><h4>{place.name}</h4><p>{place.type.replace("_", " ").toLowerCase()} · {place.distanceM} m away</p></div>
            <span className="place-arrow" aria-hidden="true">↗</span>
          </article>
        )) : <p className="empty-copy">No nearby pause spaces were returned for this route.</p>}
      </div>
    </section>
  );
}
