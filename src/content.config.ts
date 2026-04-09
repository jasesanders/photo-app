import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const albums = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/albums" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    location: z
      .object({
        lat: z.number(),
        lng: z.number(),
        name: z.string(),
      })
      .optional(),
    region: z
      .enum([
        "north-america",
        "central-america",
        "south-america",
        "europe",
        "asia",
        "africa",
        "oceania",
      ])
      .optional(),
    tags: z.array(z.string()).default([]),
    cover: z.string(),
    pinType: z.string().default("has-album"),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const pins = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/pins" }),
  schema: z.object({
    places: z.array(
      z.object({
        name: z.string(),
        lat: z.number(),
        lng: z.number(),
        type: z.string().default("visited"),
        tags: z.array(z.string()).default([]),
        notes: z.string().optional(),
        date: z.coerce.date().optional(),
      })
    ),
  }),
});

export const collections = { albums, pins };
