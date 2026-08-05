import type { QuietSpace } from "@sensory-melbourne/contracts";

export function QuietSpaces({ places }: { places: QuietSpace[] }) {
  return (
    <section className="quiet-spaces" aria-labelledby="quiet-heading">
      <div className="section-kicker">Pause nearby</div>
      <h2 id="quiet-heading">Quiet-space candidates</h2>
      <p className="section-copy">Public places that may offer a lower-stimulation break. Suitability must be user-validated.</p>
      <div className="quiet-list">
        {places.map((place) => (
          <article key={place.id}>
            <span className="quiet-icon" aria-hidden="true">{place.type === "PARK" ? "♧" : "▤"}</span>
            <div><h3>{place.name}</h3><p>{place.type.replace("_", " ").toLowerCase()} · {place.distanceM} m away</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
