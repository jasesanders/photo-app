/**
 * Image utilities for generating R2 URLs and responsive srcsets.
 *
 * In development, images can be served from /images/ in the public folder.
 * In production, they'll be served from a Cloudflare R2 bucket.
 */

const R2_BASE_URL = import.meta.env.PUBLIC_R2_URL || "/images";

const WIDTHS = [400, 800, 1200, 1600, 2400] as const;
const FORMATS = ["avif", "webp", "jpeg"] as const;

export type ImageFormat = (typeof FORMATS)[number];
export type ImageWidth = (typeof WIDTHS)[number];

export interface ImageMeta {
  id: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
}

/** Build the URL for a specific image variant */
export function imageUrl(
  albumSlug: string,
  imageId: string,
  width: ImageWidth = 1200,
  format: ImageFormat = "jpeg"
): string {
  return `${R2_BASE_URL}/${albumSlug}/${imageId}-${width}w.${format}`;
}

/** Build a srcset string for responsive images */
export function imageSrcset(
  albumSlug: string,
  imageId: string,
  format: ImageFormat = "jpeg"
): string {
  return WIDTHS.map(
    (w) => `${imageUrl(albumSlug, imageId, w, format)} ${w}w`
  ).join(", ");
}

/** Default sizes attribute for responsive images */
export function imageSizes(layout: "full" | "half" | "third" = "full"): string {
  switch (layout) {
    case "full":
      return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px";
    case "half":
      return "(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 600px";
    case "third":
      return "(max-width: 768px) 100vw, (max-width: 1200px) 30vw, 400px";
  }
}

export { WIDTHS, FORMATS };
