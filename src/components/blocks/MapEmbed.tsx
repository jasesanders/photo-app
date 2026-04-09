import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { lightMapStyle, darkMapStyle } from "../map/mapStyles";

interface Props {
  lat: number;
  lng: number;
  zoom?: number;
  label?: string;
  height?: string;
}

export default function MapEmbed({
  lat,
  lng,
  zoom = 12,
  label,
  height = "300px",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: isDark ? darkMapStyle : lightMapStyle,
      center: [lng, lat],
      zoom,
      interactive: true,
      scrollZoom: false,
    });

    // Add pin
    map.on("load", () => {
      new maplibregl.Marker({ color: "#8B6E4E" })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    // Theme observer
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
  }, [lat, lng, zoom]);

  return (
    <div style={{ width: "100%", borderRadius: "8px", overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height }} />
      {label && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            padding: "0.5rem 0",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
