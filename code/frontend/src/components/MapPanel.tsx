import { useEffect, useRef } from "react";
import type { QuietSpace, RouteOption, TransportAccessPoint } from "@sensory-melbourne/contracts";

type Props = {
  route: RouteOption | undefined;
  quietSpaces: QuietSpace[];
  selectedQuietSpace: QuietSpace | undefined;
  transportAccess: TransportAccessPoint[];
};

function mapRouteColour(route: RouteOption): string {
  if (route.sensoryLevel === "LOW") return "#276654";
  if (route.sensoryLevel === "MODERATE") return "#96631a";
  return "#9a463f";
}

export function MapPanel({ route, quietSpaces, selectedQuietSpace, transportAccess }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapToken || !container.current || !route) return;
    let cancelled = false;
    let map: import("mapbox-gl").Map | undefined;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !container.current) return;
      mapboxgl.accessToken = mapToken;
      map = new mapboxgl.Map({
        container: container.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [144.9631, -37.812],
        zoom: 14.2,
        attributionControl: true
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        if (!map) return;
        map.addSource("selected-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: route.geometry }
        });
        map.addLayer({
          id: "selected-route-outline",
          type: "line",
          source: "selected-route",
          paint: { "line-color": "#ffffff", "line-width": 11, "line-opacity": 0.92 }
        });
        map.addLayer({
          id: "selected-route",
          type: "line",
          source: "selected-route",
          paint: { "line-color": mapRouteColour(route), "line-width": 6, "line-opacity": 0.95 }
        });

        const bounds = new mapboxgl.LngLatBounds();
        route.geometry.coordinates.forEach((coordinate) => bounds.extend(coordinate));
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 74, maxZoom: 15.5, duration: 0 });

        const start = route.geometry.coordinates[0];
        const destination = route.geometry.coordinates.at(-1);
        if (start) new mapboxgl.Marker({ color: "#173f35", scale: 0.82 }).setLngLat(start).setPopup(new mapboxgl.Popup({ offset: 16 }).setText("Start")).addTo(map);
        if (destination) new mapboxgl.Marker({ color: "#173f35", scale: 0.95 }).setLngLat(destination).setPopup(new mapboxgl.Popup({ offset: 16 }).setText("Destination")).addTo(map);

        const displayedQuietSpaces = selectedQuietSpace && !quietSpaces.some((place) => place.id === selectedQuietSpace.id)
          ? [...quietSpaces, selectedQuietSpace]
          : quietSpaces;
        displayedQuietSpaces.forEach((place) => {
          const marker = new mapboxgl.Marker({
            color: place.id === selectedQuietSpace?.id ? "#173f35" : "#5f877d",
            scale: place.id === selectedQuietSpace?.id ? 0.88 : 0.72
          })
            .setLngLat([place.location.lng, place.location.lat])
            .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(`${place.name} · ${place.distanceM} m from route`))
            .addTo(map!);
          if (place.id === selectedQuietSpace?.id) {
            marker.togglePopup();
            map!.flyTo({ center: [place.location.lng, place.location.lat], zoom: 16, duration: 0 });
          }
        });
        transportAccess.forEach((point) => {
          new mapboxgl.Marker({ color: "#7d6752", scale: 0.7 })
            .setLngLat([point.location.lng, point.location.lat])
            .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(`${point.name} · ${point.type.toLowerCase()}`))
            .addTo(map!);
        });
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [mapToken, quietSpaces, route, selectedQuietSpace, transportAccess]);

  if (!mapToken) {
    return (
      <div
        className="map-fallback"
        role="img"
        aria-label={`Schematic map of ${route?.name ?? "the selected Melbourne CBD route"}${selectedQuietSpace ? `. Focused pause space: ${selectedQuietSpace.name}, ${selectedQuietSpace.distanceM} metres from route.` : ""}`}
      >
        <div className="map-water" aria-hidden="true" />
        <div className="map-grid" aria-hidden="true" />
        <span className="map-street street-one" aria-hidden="true">Swanston St</span>
        <span className="map-street street-two" aria-hidden="true">Lonsdale St</span>
        <span className="map-street street-three" aria-hidden="true">Russell St</span>
        <div className={`route-line route-${route?.sensoryLevel.toLowerCase() ?? "low"}`} aria-hidden="true"><span /><i /><b /></div>
        <span className="map-pin start"><i aria-hidden="true" />Start</span>
        <span className="map-pin destination"><i aria-hidden="true" />Destination</span>
        <span className="schematic-place library" aria-hidden="true">▤</span>
        <span className="schematic-place park" aria-hidden="true">✦</span>
        {selectedQuietSpace && (
          <div className="schematic-selected-place">
            <span aria-hidden="true">✦</span>
            <small>Focused pause space</small>
            <strong>{selectedQuietSpace.name}</strong>
            <small>{selectedQuietSpace.distanceM} m from route</small>
          </div>
        )}
        <div className="map-note">
          <span className={`level level-${route?.sensoryLevel.toLowerCase() ?? "low"}`}>{route?.sensoryLevel ?? "LOW"} LOAD</span>
          <strong>{route ? `${Math.round(route.sensoryScore * 100)}/100 crowd score` : "Route data loading"}</strong>
          <span>Schematic mode · live map renderer is ready</span>
        </div>
      </div>
    );
  }

  return <div ref={container} className="map-canvas" aria-label="Interactive route map" />;
}
