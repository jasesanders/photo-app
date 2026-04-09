#!/usr/bin/env npx tsx
/**
 * Lightroom import script.
 *
 * Usage:
 *   npx tsx scripts/import-lightroom.ts <export-dir> [--year 2024]
 *
 * Expects a directory structure from Lightroom Classic export:
 *   <export-dir>/
 *     Album Name/
 *       photo1.jpg
 *       photo1.xmp  (optional sidecar)
 *       photo2.jpg
 *       ...
 *
 * For each album folder, this script:
 * 1. Processes all images (generates responsive variants)
 * 2. Reads XMP sidecars for keywords/ratings
 * 3. Extracts EXIF GPS for location data
 * 4. Scaffolds an MDX file with default PhotoGrid layout
 * 5. Writes meta.json with image manifest
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as exifr from "exifr";
import { execSync } from "node:child_process";

const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp", ".heic",
]);

interface XmpData {
  keywords: string[];
  rating: number;
  label: string;
}

function parseXmp(xmpPath: string): XmpData {
  const result: XmpData = { keywords: [], rating: 0, label: "" };

  try {
    const content = fs.readFileSync(xmpPath, "utf-8");

    // Extract rating
    const ratingMatch = content.match(/xmp:Rating="(\d)"/);
    if (ratingMatch) result.rating = parseInt(ratingMatch[1]);

    // Extract label
    const labelMatch = content.match(/xmp:Label="([^"]+)"/);
    if (labelMatch) result.label = labelMatch[1];

    // Extract keywords
    const keywordMatches = content.matchAll(
      /<dc:subject>[\s\S]*?<rdf:li>(.+?)<\/rdf:li>[\s\S]*?<\/dc:subject>/g
    );
    for (const match of keywordMatches) {
      result.keywords.push(match[1]);
    }

    // Also try individual li elements within subject
    const liMatches = content.matchAll(/<rdf:li>(.+?)<\/rdf:li>/g);
    const allLi: string[] = [];
    for (const match of liMatches) {
      allLi.push(match[1]);
    }
    if (allLi.length > 0 && result.keywords.length === 0) {
      // Filter out non-keyword entries (rough heuristic)
      result.keywords = allLi.filter(
        (s) => !s.includes("/") && !s.includes("=") && s.length < 50
      );
    }
  } catch {
    // XMP parsing is best-effort
  }

  return result;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getAlbumLocation(
  imageDir: string,
  imageFiles: string[]
): Promise<{ lat: number; lng: number } | null> {
  // Try to get GPS from the first image that has it
  for (const file of imageFiles.slice(0, 5)) {
    try {
      const exif = await exifr.parse(path.join(imageDir, file), {
        gps: true,
        pick: ["latitude", "longitude"],
      });
      if (exif?.latitude && exif?.longitude) {
        return { lat: exif.latitude, lng: exif.longitude };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function generateMdx(
  albumSlug: string,
  title: string,
  date: string,
  location: { lat: number; lng: number } | null,
  tags: string[],
  imageCount: number
): string {
  const imageIds = Array.from({ length: imageCount }, (_, i) =>
    String(i + 1).padStart(3, "0")
  );

  const locationYaml = location
    ? `\nlocation:\n  lat: ${location.lat}\n  lng: ${location.lng}\n  name: "TODO: Add location name"`
    : "";

  const regionGuess = location
    ? guessRegion(location.lat, location.lng)
    : "";
  const regionYaml = regionGuess ? `\nregion: "${regionGuess}"` : "";

  // Create a grid-based layout with the first image as a feature
  const gridIds = imageIds.slice(1);
  const gridChunks: string[] = [];
  for (let i = 0; i < gridIds.length; i += 6) {
    const chunk = gridIds.slice(i, i + 6);
    gridChunks.push(
      `<PhotoGrid albumSlug="${albumSlug}" ids={${JSON.stringify(chunk)}} columns={3} />`
    );
  }

  return `---
title: "${title}"
date: ${date}${locationYaml}${regionYaml}
tags: ${JSON.stringify(tags)}
cover: "001"
description: "TODO: Add description"
---

import SingleFeature from "${relativeImportPath(albumSlug, "SingleFeature")}";
import TextBlock from "${relativeImportPath(albumSlug, "TextBlock")}";
import PhotoGrid from "${relativeImportPath(albumSlug, "PhotoGrid")}";

<SingleFeature albumSlug="${albumSlug}" id="001" caption="TODO: Add caption" />

<TextBlock>
TODO: Add description text for this album.
</TextBlock>

${gridChunks.join("\n\n")}
`;
}

function relativeImportPath(albumSlug: string, component: string): string {
  const depth = albumSlug.split("/").length + 1; // +1 for content/albums
  const prefix = "../".repeat(depth + 1);
  return `${prefix}components/blocks/${component}.astro`;
}

function guessRegion(
  lat: number,
  lng: number
): string {
  if (lat > 15 && lat < 72 && lng > -170 && lng < -50) return "north-america";
  if (lat > -5 && lat <= 15 && lng > -120 && lng < -60) return "central-america";
  if (lat <= -5 && lng > -90 && lng < -30) return "south-america";
  if (lat > 35 && lng > -30 && lng < 60) return "europe";
  if (lat > -10 && lat <= 70 && lng >= 60 && lng < 180) return "asia";
  if (lat > -10 && lat <= 35 && lng >= 25 && lng < 60) return "asia";
  if (lat <= -10 && lng > 100) return "oceania";
  if (lat <= 35 && lng > -20 && lng < 55) return "africa";
  return "";
}

async function main() {
  const args = process.argv.slice(2);
  const exportDir = args[0];
  const yearFlag = args.indexOf("--year");
  const year = yearFlag >= 0 ? args[yearFlag + 1] : undefined;

  if (!exportDir) {
    console.error("Usage: npx tsx scripts/import-lightroom.ts <export-dir> [--year 2024]");
    process.exit(1);
  }

  const resolvedDir = path.resolve(exportDir);
  if (!fs.existsSync(resolvedDir)) {
    console.error(`Directory not found: ${resolvedDir}`);
    process.exit(1);
  }

  // Each subdirectory is an album
  const entries = fs
    .readdirSync(resolvedDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  if (entries.length === 0) {
    console.error("No album folders found. Expected subdirectories with images.");
    process.exit(1);
  }

  console.log(`Found ${entries.length} album folders in ${resolvedDir}\n`);

  for (const entry of entries) {
    const albumDir = path.join(resolvedDir, entry.name);
    const title = entry.name;
    const slug = slugify(title);

    // Find images
    const files = fs
      .readdirSync(albumDir)
      .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
      .sort();

    if (files.length === 0) {
      console.log(`  Skipping ${title} (no images)`);
      continue;
    }

    // Collect XMP keywords
    const allKeywords = new Set<string>();
    for (const file of files) {
      const xmpPath = path.join(
        albumDir,
        path.basename(file, path.extname(file)) + ".xmp"
      );
      if (fs.existsSync(xmpPath)) {
        const xmp = parseXmp(xmpPath);
        xmp.keywords.forEach((k) => allKeywords.add(k.toLowerCase()));
      }
    }

    // Get GPS location
    const location = await getAlbumLocation(albumDir, files);

    // Determine year from first image EXIF or flag
    let albumYear = year || new Date().getFullYear().toString();
    try {
      const exif = await exifr.parse(path.join(albumDir, files[0]), {
        pick: ["DateTimeOriginal"],
      });
      if (exif?.DateTimeOriginal) {
        albumYear = new Date(exif.DateTimeOriginal).getFullYear().toString();
      }
    } catch {}

    const albumSlug = `${albumYear}/${slug}`;
    const date = `${albumYear}-01-01`; // Placeholder, will be refined from EXIF

    console.log(`Processing: ${title} -> ${albumSlug} (${files.length} images)`);

    // Process images using the process-images script
    execSync(
      `npx tsx scripts/process-images.ts "${albumDir}" "${albumSlug}"`,
      { stdio: "inherit" }
    );

    // Generate MDX scaffold
    const tags = Array.from(allKeywords).slice(0, 10);
    const mdxContent = generateMdx(
      albumSlug,
      title,
      date,
      location,
      tags,
      files.length
    );

    const mdxPath = path.resolve(
      "src/content/albums",
      albumSlug,
      "index.mdx"
    );
    // Don't overwrite existing MDX (user may have customized it)
    if (!fs.existsSync(mdxPath)) {
      fs.mkdirSync(path.dirname(mdxPath), { recursive: true });
      fs.writeFileSync(mdxPath, mdxContent);
      console.log(`  Created ${mdxPath}`);
    } else {
      console.log(`  Skipping MDX (already exists): ${mdxPath}`);
    }

    console.log("");
  }

  console.log("Import complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
