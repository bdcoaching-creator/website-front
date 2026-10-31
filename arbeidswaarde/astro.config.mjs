// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// [NOG TE CONTROLEREN] Definitief domein. Nu overgenomen van het visitekaartje op het merkbord.
export default defineConfig({
  site: "https://www.arbeidswaarde.nl",
  integrations: [sitemap({ filter: (page) => !page.includes("/404") && !page.includes("/verzonden") })],
});
