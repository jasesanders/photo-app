#!/usr/bin/env npx tsx
/**
 * Image processing pipeline.
 *
 * Usage:
 *   npx tsx scripts/process-images.ts <input-dir> <album-slug>
 *
 * Example:
 *   npx tsx scripts/process-images.ts ~/Photos/tokyo-2024 2024/tokyo-spring
 *
 * This script:
 * 1. Reads all images from the input directory
 * 2. Extracts EXIF data (GPS, camera, date, lens)
 * 3. Generates responsive variants (5 widths x 3 formats = 15 per image)
 * 4. Outputs processed images + meta.json to public/images/<album-slug>/
 */

import sharp from "sharp";
import * as exifr from "exifr";
import * as fs from "node:fs";
import * as path from "node:path";

const WIDTHS = [400, 800, 1200, 1600, 2400] as const;
const FORMATS = ["avif", "webp", "jpeg"] as const;
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".tiff",
  ".tif",
  ".webp",
  ".heic",
  ".heif",
  ".arw",
  ".cr2",
  ".nef",
  ".dng",
]);

interface ImageMetadata {
  id: string;
  originalFile: string;
  width: number;
  height: number;
  dateTaken?: string;
  camera?: string;
  lens?: string;
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
  gps?: {
    lat: number;
    lng: number;
  };
}

interface AlbumMeta {
  images: ImageMetadata[];
  processedAt: string;
  albumSlug: string;
}

async function extractExif(
  filePath: string
): Promise<Partial<ImageMetadata>> {
  try {
    const exif = await exifr.parse(filePath, {
      gps: true,
      pick: [
        "DateTimeOriginal",
        "Make",
        "Model",
        "LensModel",
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO",
        "latitude",
        "longitude",
      ],
    });

    if (!exif) return {};

    const meta: Partial<ImageMetadata> = {};

    if (exif.DateTimeOriginal) {
      meta.dateTaken = new Date(exif.DateTimeOriginal).toISOString();
    }
    if (exif.Make || exif.Model) {
      meta.camera = [exif.Make, exif.Model].filter(Boolean).join(" ");
    }
    if (exif.LensModel) meta.lens = exif.LensModel;
    if (exif.FocalLength) meta.focalLength = exif.FocalLength;
    if (exif.FNumber) meta.aperture = exif.FNumber;
    if (exif.ExposureTime) {
      meta.shutterSpeed =
        exif.ExposureTime < 1
          ? `1/${Math.round(1 / exif.ExposureTime)}`
          : `${exif.ExposureTime}`;
    }
    if (exif.ISO) meta.iso = exif.ISO;
    if (exif.latitude && exif.longitude) {
      meta.gps = { lat: exif.latitude, lng: exif.longitude };
    }

    return meta;
  } catch {
    console.warn(`  Could not extract EXIF from ${path.basename(filePath)}`);
    return {};
  }
}

async function processImage(
  inputPath: string,
  outputDir: string,
  imageId: string
): Promise<ImageMetadata> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const originalWidth = metadata.width || 2400;
  const originalHeight = metadata.height || 1600;

  const exif = await extractExif(inputPath);

  // Generate variants
  for (const width of WIDTHS) {
    if (width > originalWidth) continue;

    const resized = sharp(inputPath).resize(width, undefined, {
      withoutEnlargement: true,
    });

    for (const format of FORMATS) {
      const outputPath = path.join(outputDir, `${imageId}-${width}w.${format}`);

      switch (format) {
        case "avif":
          await resized.clone().avif({ quality: 65 }).toFile(outputPath);
          break;
        case "webp":
          await resized.clone().webp({ quality: 80 }).toFile(outputPath);
          break;
        case "jpeg":
          await resized
            .clone()
            .jpeg({ quality: 85, mozjpeg: true })
            .toFile(outputPath);
          break;
      }
    }
  }

  return {
    id: imageId,
    originalFile: path.basename(inputPath),
    width: originalWidth,
    height: originalHeight,
    ...exif,
  };
}

async function main() {
  const [inputDir, albumSlug] = process.argv.slice(2);

  if (!inputDir || !albumSlug) {
    console.error(
      "Usage: npx tsx scripts/process-images.ts <input-dir> <album-slug>"
    );
    console.error(
      "Example: npx tsx scripts/process-images.ts ~/Photos/tokyo 2024/tokyo-spring"
    );
    process.exit(1);
  }

  const resolvedInput = path.resolve(inputDir);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`Input directory not found: ${resolvedInput}`);
    process.exit(1);
  }

  const outputDir = path.resolve("public/images", albumSlug);
  fs.mkdirSync(outputDir, { recursive: true });

  // Find image files
  const files = fs
    .readdirSync(resolvedInput)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.error("No image files found in input directory.");
    process.exit(1);
  }

  console.log(`Processing ${files.length} images from ${resolvedInput}`);
  console.log(`Output: ${outputDir}\n`);

  const images: ImageMetadata[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imageId = String(i + 1).padStart(3, "0");
    const inputPath = path.join(resolvedInput, file);

    console.log(
      `  [${i + 1}/${files.length}] ${file} -> ${imageId}`
    );

    const meta = await processImage(inputPath, outputDir, imageId);
    images.push(meta);
  }

  // Write metadata
  const albumMeta: AlbumMeta = {
    images,
    processedAt: new Date().toISOString(),
    albumSlug,
  };

  const metaPath = path.resolve("src/content/albums", albumSlug, "meta.json");
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, JSON.stringify(albumMeta, null, 2));

  console.log(`\nDone! Processed ${images.length} images.`);
  console.log(`Metadata written to ${metaPath}`);

  // Print GPS summary if any images have coordinates
  const gpsImages = images.filter((img) => img.gps);
  if (gpsImages.length > 0) {
    const avgLat =
      gpsImages.reduce((sum, img) => sum + img.gps!.lat, 0) / gpsImages.length;
    const avgLng =
      gpsImages.reduce((sum, img) => sum + img.gps!.lng, 0) / gpsImages.length;
    console.log(
      `\nGPS data found in ${gpsImages.length}/${images.length} images.`
    );
    console.log(`Average location: ${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
