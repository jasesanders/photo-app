import type { StyleSpecification } from "maplibre-gl";

/**
 * Custom muted map style that matches the site's warm, typographic aesthetic.
 * Uses OpenFreeMap tiles.
 */
export const lightMapStyle: StyleSpecification = {
  version: 8,
  name: "Photo Mapper Light",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    },
  },
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#F0EDE7" },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": "#D4CFC7" },
    },
    {
      id: "landcover",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      paint: { "fill-color": "#E8E4DC", "fill-opacity": 0.5 },
    },
    {
      id: "landuse",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      paint: { "fill-color": "#E5E1D9", "fill-opacity": 0.3 },
    },
    {
      id: "boundary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      paint: {
        "line-color": "#C4BFB7",
        "line-width": 0.5,
        "line-dasharray": [3, 2],
      },
    },
    {
      id: "road-minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", "class", "minor", "service"],
      paint: { "line-color": "#E8E4DC", "line-width": 0.5 },
      minzoom: 12,
    },
    {
      id: "road-secondary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", "class", "secondary", "tertiary"],
      paint: { "line-color": "#DDD9D1", "line-width": 1 },
      minzoom: 8,
    },
    {
      id: "road-primary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["==", "class", "primary"],
      paint: { "line-color": "#D4CFC7", "line-width": 1.5 },
      minzoom: 6,
    },
    {
      id: "road-motorway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", "class", "motorway", "trunk"],
      paint: { "line-color": "#CBC6BE", "line-width": 2 },
      minzoom: 4,
    },
    {
      id: "place-label-city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", "class", "city"],
      layout: {
        "text-field": "{name:latin}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 14,
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#8A857D",
        "text-halo-color": "#F0EDE7",
        "text-halo-width": 1.5,
      },
      minzoom: 4,
    },
    {
      id: "place-label-town",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", "class", "town"],
      layout: {
        "text-field": "{name:latin}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#9B9590",
        "text-halo-color": "#F0EDE7",
        "text-halo-width": 1,
      },
      minzoom: 7,
    },
    {
      id: "country-label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["==", "class", "country"],
      layout: {
        "text-field": "{name:latin}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 16,
        "text-max-width": 10,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
      },
      paint: {
        "text-color": "#A09A94",
        "text-halo-color": "#F0EDE7",
        "text-halo-width": 2,
      },
      minzoom: 2,
      maxzoom: 6,
    },
  ],
};

export const darkMapStyle: StyleSpecification = {
  ...lightMapStyle,
  name: "Photo Mapper Dark",
  layers: lightMapStyle.layers.map((layer) => {
    const l = { ...layer } as any;
    if (l.paint) {
      l.paint = { ...l.paint };
      // Swap colors for dark mode
      const colorMap: Record<string, string> = {
        "#F0EDE7": "#1A1A1A",
        "#D4CFC7": "#2A2A2A",
        "#E8E4DC": "#222222",
        "#E5E1D9": "#1E1E1E",
        "#C4BFB7": "#3A3A3A",
        "#DDD9D1": "#2E2E2E",
        "#CBC6BE": "#333333",
        "#8A857D": "#706A64",
        "#9B9590": "#5A5550",
        "#A09A94": "#606060",
      };
      for (const [key, value] of Object.entries(l.paint)) {
        if (typeof value === "string" && colorMap[value]) {
          l.paint[key] = colorMap[value];
        }
      }
    }
    return l;
  }),
};
