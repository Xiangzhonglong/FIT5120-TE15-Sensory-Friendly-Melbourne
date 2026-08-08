import type { ResponseMode, RouteSearchResponse } from "@sensory-melbourne/contracts";
import { formatMelbourneDateTime } from "../services/dateTime";

type Props = {
  dataSources: RouteSearchResponse["dataSources"];
  generatedAt: string;
  mode: ResponseMode;
};

const sourceLabels: Record<keyof RouteSearchResponse["dataSources"], string> = {
  routing: "Walking routes",
  pedestrian: "Pedestrian load",
  quietSpaces: "Pause spaces",
  transport: "Transport access"
};

export function DataSources({ dataSources, generatedAt, mode }: Props) {
  return (
    <details className="source-panel">
      <summary>
        <span><i aria-hidden="true">i</i><strong>How this route was calculated</strong></span>
        <small>{mode === "LIVE" ? "Live sources" : mode === "MIXED" ? "Mixed source modes" : mode === "SNAPSHOT" ? "Saved source snapshot" : "Clearly labelled demo sources"}</small>
      </summary>
      <div className="source-content">
        <div className="source-intro">
          <p>Each data boundary reports its own mode, age and confidence. Saved or demonstration data is never labelled as live.</p>
          <span>Response generated {formatMelbourneDateTime(generatedAt)}</span>
        </div>
        <div className="source-grid">
          {Object.entries(dataSources).map(([key, status]) => (
            <article key={key}>
              <div><strong>{sourceLabels[key as keyof typeof sourceLabels]}</strong><span className={`source-mode mode-${status.mode.toLowerCase()}`}>{status.mode}</span></div>
              <p>{status.source}</p>
              <dl>
                <div><dt>Updated</dt><dd>{formatMelbourneDateTime(status.timestamp)}</dd></div>
                <div><dt>Confidence</dt><dd>{status.confidence.toLowerCase()}</dd></div>
                <div><dt>Freshness</dt><dd>{status.stale ? "May be stale" : "Current for its mode"}</dd></div>
              </dl>
              {status.fallbackReason && <p className="fallback-reason">Fallback: {status.fallbackReason}</p>}
            </article>
          ))}
        </div>
      </div>
    </details>
  );
}
