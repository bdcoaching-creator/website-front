// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// [NOG TE CONTROLEREN] Definitief domein. Nu overgenomen van het visitekaartje op het merkbord.
export default defineConfig({
  site: "https://www.arbeidswaarde.nl",
  integrations: [sitemap({
      // Niet in de sitemap: foutpagina, bevestiging en de privacyverklaring zolang die een concept is.
      filter: (page) => !["/404", "/verzonden", "/privacy"].some((pad) => page.includes(pad)),
    })],
});
