import { getCollection } from "astro:content";

export async function getDiensten() {
  const diensten = await getCollection("diensten");
  return diensten.sort((a, b) => a.data.volgorde - b.data.volgorde);
}

export const dienstUrl = (id: string) => `/diensten/${id}`;

/** Nette paden zonder ".html" of "/index" (build.format = "file"). */
export const schoonPad = (pathname: string) =>
  pathname.replace(/\.html$/, "").replace(/\/index$/, "").replace(/\/$/, "") || "/";

/** Voorkomt dat "re-integratie" in koppen over twee regels wordt afgebroken. */
export const zonderAfbreken = (tekst: string) => tekst.replace(/re-integratie/gi, (m) => m.replace("-", "‑"));
