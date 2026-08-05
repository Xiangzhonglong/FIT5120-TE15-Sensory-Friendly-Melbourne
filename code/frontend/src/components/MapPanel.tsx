import { useEffect, useRef } from "react";
import type { QuietSpace, RouteOption } from "@sensory-melbourne/contracts";

type Props = {
  route: RouteOption | undefined;
  quietSpaces: QuietSpace[];
};

export function MapPanel({ route, quietSpaces }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapToken = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    if (!mapToken || !container.current) return;
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
        if (!route || !map) return;
        map.addSource("selected-route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: route.geometry }
        });
        map.addLayer({
          id: "selected-route",
          type: "line",
          source: "selected-route",
          paint: { "line-color": "#315f55", "line-width": 6, "line-opacity": 0.9 }
        });
        quietSpaces.forEach((place) => {
          new mapboxgl.Marker({ color: "#4c746a", scale: 0.8 })
            .setLngLat([place.location.lng, place.location.lat])
            .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(place.name))
            .addTo(map!);
        });
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [mapToken, quietSpaces, route]);

  if (!mapToken) {
    return (
      <div className="map-fallback" role="img" aria-label="Schematic map of selected Melbourne CBD route">
        <div className="map-grid" aria-hidden="true" />
        <div className="route-line" aria-hidden="true" />
        <span className="map-pin start">Start</span>
        <span className="map-pin destination">Destination</span>
        <div className="map-note">
          <strong>Map boundary ready</strong>
          <span>Add a restricted VITE_MAPBOX_TOKEN to render the live map.</span>
        </div>
      </div>
    );
  }

  return <div ref={container} className="map-canvas" aria-label="Interactive route map" />;
}
