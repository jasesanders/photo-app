#!/usr/bin/env npx tsx
/**
 * Generate GeoJSON from album metadata and places.yaml.
 *
 * Usage:
 *   npx tsx scripts/generate-map-data.ts
 *
 * Outputs: public/map-data.json
 *
 * This is run at build time to create the static GeoJSON file
 * used by the interactive map. It's also useful for debugging
 * to see all locations at a glance.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "yaml";

interface GeoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: Record<string, any>;
}

function main() {
  const features: GeoFeature[] = [];

  // 1. Scan album MDX frontmatter for locations
  const albumsDir = path.resolve("src/content/albums");
  if (fs.existsSync(albumsDir)) {
    scanAlbums(albumsDir, features);
  }

  // 2. Read places.yaml
  const placesPath = path.resolve("src/content/pins/places.yaml");
  if (fs.existsSync(placesPath)) {
    const content = fs.readFileSync(placesPath, "utf-8");
    const data = yaml.parse(content);
    if (data?.places) {
      for (const place of data.places) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [place.lng, place.lat],
          },
          properties: {
            name: place.name,
            type: place.type || "visited",
            tags: place.tags || [],
            notes: place.notes || "",
            date: place.date || "",
          },
        });
      }
    }
  }

  const geojson = {
    type: "FeatureCollection" as const,
    features,
  };

  const outputPath = path.resolve("public/map-data.json");
  fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));

  console.log(`Generated ${features.length} features -> ${outputPath}`);
  console.log(
    `  Albums with location: ${features.filter((f) => f.properties.albumSlug).length}`
  );
  console.log(
    `  Places: ${features.filter((f) => !f.properties.albumSlug).length}`
  );
}

function scanAlbums(dir: string, features: GeoFeature[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanAlbums(fullPath, features);
      continue;
    }

    if (entry.name !== "index.mdx") continue;

    const content = fs.readFileSync(fullPath, "utf-8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const frontmatter = yaml.parse(frontmatterMatch[1]);
    if (!frontmatter?.location?.lat || !frontmatter?.location?.lng) continue;

    // Derive album slug from path
    const albumsBase = path.resolve("src/content/albums");
    const albumSlug = path
      .dirname(fullPath)
      .replace(albumsBase + "/", "");

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [frontmatter.location.lng, frontmatter.location.lat],
      },
      properties: {
        name: frontmatter.title,
        type: frontmatter.pinType || "has-album",
        albumSlug,
        tags: frontmatter.tags || [],
        date: frontmatter.date || "",
        cover: frontmatter.cover || "",
      },
    });
  }
}

main();
