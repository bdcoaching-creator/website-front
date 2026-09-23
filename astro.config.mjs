// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Pas `site` aan zodra het definitieve domein bekend is.
export default defineConfig({
  site: "https://www.adeptxs.nl",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [sitemap({ filter: (page) => !page.includes("/bedankt") })],
});
