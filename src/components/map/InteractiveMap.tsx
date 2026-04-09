import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { lightMapStyle, darkMapStyle } from "./mapStyles";
import MapControls from "./MapControls";
import PinPopup from "./PinPopup";

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  albumSlug?: string;
  coverImage?: string;
  date?: string;
  tags: string[];
  notes?: string;
}

interface PinTypeConfig {
  id: string;
  name: string;
  color: string;
}

interface Props {
  pins: MapPin[];
  pinTypes: PinTypeConfig[];
}

export default function InteractiveMap({ pins, pinTypes }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(pinTypes.map((pt) => pt.id))
  );
  const [popupPin, setPopupPin] = useState<MapPin | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: isDark ? darkMapStyle : lightMapStyle,
      center: [0, 30],
      zoom: 2,
      maxZoom: 16,
      minZoom: 1,
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    map.on("load", () => {
      // Add pin source as GeoJSON
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: pins.map((pin) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [pin.lng, pin.lat],
          },
          properties: {
            id: pin.id,
            name: pin.name,
            type: pin.type,
            albumSlug: pin.albumSlug || "",
            coverImage: pin.coverImage || "",
            date: pin.date || "",
            tags: pin.tags.join(","),
            notes: pin.notes || "",
          },
        })),
      };

      map.addSource("pins", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 40,
      });

      // Cluster circles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "pins",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#8B6E4E",
          "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 10, 30],
          "circle-opacity": 0.85,
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "pins",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Noto Sans Regular"],
          "text-size": 13,
        },
        paint: {
          "text-color": "#F5F2ED",
        },
      });

      // Individual pin circles colored by type
      for (const pt of pinTypes) {
        map.addLayer({
          id: `pin-${pt.id}`,
          type: "circle",
          source: "pins",
          filter: [
            "all",
            ["!", ["has", "point_count"]],
            ["==", ["get", "type"], pt.id],
          ],
          paint: {
            "circle-color": pt.color,
            "circle-radius": pt.id === "visited" ? 6 : 9,
            "circle-stroke-color": isDark ? "#1A1A1A" : "#F5F2ED",
            "circle-stroke-width": 2,
          },
        });
      }

      // Click handler for clusters
      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!features.length) return;
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource("pins") as maplibregl.GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coords = (features[0].geometry as GeoJSON.Point).coordinates;
        map.easeTo({
          center: [coords[0], coords[1]],
          zoom,
        });
      });

      // Click handler for individual pins
      const pinLayers = pinTypes.map((pt) => `pin-${pt.id}`);
      for (const layerId of pinLayers) {
        map.on("click", layerId, (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const props = feature.properties;
          const coords = (feature.geometry as GeoJSON.Point).coordinates;

          const pin: MapPin = {
            id: props.id,
            name: props.name,
            lat: coords[1],
            lng: coords[0],
            type: props.type,
            albumSlug: props.albumSlug || undefined,
            coverImage: props.coverImage || undefined,
            date: props.date || undefined,
            tags: props.tags ? props.tags.split(",").filter(Boolean) : [],
            notes: props.notes || undefined,
          };

          setPopupPin(pin);

          // Show popup
          if (popupRef.current) popupRef.current.remove();
          const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "320px",
            className: "map-popup",
          })
            .setLngLat([coords[0], coords[1]])
            .setHTML(`<div id="popup-content"></div>`)
            .addTo(map);

          popupRef.current = popup;
          popup.on("close", () => setPopupPin(null));
        });

        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      // Fit bounds to all pins
      if (pins.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        pins.forEach((pin) => bounds.extend([pin.lng, pin.lat]));
        map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
      }
    });

    // Theme change listener
    const observer = new MutationObserver(() => {
      const nowDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      map.setStyle(nowDark ? darkMapStyle : lightMapStyle);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [pins, pinTypes]);

  // Filter visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    for (const pt of pinTypes) {
      const layerId = `pin-${pt.id}`;
      try {
        map.setLayoutProperty(
          layerId,
          "visibility",
          activeFilters.has(pt.id) ? "visible" : "none"
        );
      } catch {
        // Layer may not exist yet
      }
    }
  }, [activeFilters, pinTypes]);

  const handleFilterToggle = (typeId: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      <MapControls
        pinTypes={pinTypes}
        activeFilters={activeFilters}
        onToggle={handleFilterToggle}
      />
      {popupPin && <PinPopup pin={popupPin} />}
    </div>
  );
}
