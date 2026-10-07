import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const tekstBlok = z.object({ titel: z.string(), tekst: z.string() });

const diensten = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/diensten" }),
  schema: z.object({
    titel: z.string(),
    volgorde: z.number(),
    kaartTekst: z.string(),
    seo: z.object({ titel: z.string(), omschrijving: z.string() }),
    hero: z.object({ label: z.string(), titel: z.string(), intro: z.string() }),
    cta: z.object({
      knop: z.string(),
      formulierTitel: z.string(),
      formulierIntro: z.string(),
    }),
    herkenning: z.array(z.string()),
    voorWie: z.array(tekstBlok),
    wieBetaalt: z.string(),
    oplevering: z.array(z.string()),
    stappen: z.array(tekstBlok),
    locatie: z.string(),
    kwalificatie: z.string(),
    faq: z.array(z.object({ vraag: z.string(), antwoord: z.string() })),
    werkgebiedNotitie: z.string().optional().default(""),
    vraagPostcode: z.boolean().optional().default(false),
  }),
});

const juridisch = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/juridisch" }),
  schema: z.object({
    titel: z.string(),
    omschrijving: z.string(),
    bijgewerkt: z.string(),
  }),
});

const paginas = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/paginas" }),
  schema: z.object({
    titel: z.string(),
    kop: z.string().optional(),
    omschrijving: z.string(),
    intro: z.string().optional().default(""),
  }),
});

export const collections = { diensten, juridisch, paginas };
