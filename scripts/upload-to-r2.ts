#!/usr/bin/env npx tsx
/**
 * Upload processed images to Cloudflare R2.
 *
 * Usage:
 *   npx tsx scripts/upload-to-r2.ts [album-slug]
 *
 * Without album-slug, uploads all images in public/images/.
 * With album-slug, uploads only that album's images.
 *
 * Environment variables:
 *   R2_ACCOUNT_ID     - Cloudflare account ID
 *   R2_ACCESS_KEY_ID  - R2 API token access key
 *   R2_SECRET_ACCESS_KEY - R2 API token secret
 *   R2_BUCKET_NAME    - R2 bucket name (default: "photo-mapper")
 *   R2_PUBLIC_URL     - Public URL for the bucket (for verification)
 */

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import * as fs from "node:fs";
import * as path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
};

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error("Missing R2 credentials. Set these environment variables:");
    console.error("  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function fileExists(
  client: S3Client,
  bucket: string,
  key: string
): Promise<boolean> {
  try {
    await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(
  client: S3Client,
  bucket: string,
  localPath: string,
  key: string,
  skipExisting: boolean
): Promise<boolean> {
  if (skipExisting && (await fileExists(client, bucket, key))) {
    return false;
  }

  const ext = path.extname(localPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  const body = fs.readFileSync(localPath);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return true;
}

function findFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (CONTENT_TYPES[ext]) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

async function main() {
  const albumSlug = process.argv[2];
  const bucket = process.env.R2_BUCKET_NAME || "photo-mapper";
  const imagesDir = path.resolve("public/images");

  const searchDir = albumSlug
    ? path.join(imagesDir, albumSlug)
    : imagesDir;

  const files = findFiles(searchDir);
  if (files.length === 0) {
    console.log("No image files found to upload.");
    process.exit(0);
  }

  console.log(`Uploading ${files.length} files to R2 bucket "${bucket}"...`);

  const client = getClient();
  let uploaded = 0;
  let skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const localPath = files[i];
    const key = path.relative(imagesDir, localPath);

    const wasUploaded = await uploadFile(client, bucket, localPath, key, true);
    if (wasUploaded) {
      uploaded++;
      console.log(`  [${i + 1}/${files.length}] Uploaded: ${key}`);
    } else {
      skipped++;
    }
  }

  console.log(
    `\nDone! ${uploaded} uploaded, ${skipped} skipped (already exist).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
