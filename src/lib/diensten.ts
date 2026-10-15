import { getCollection } from "astro:content";

export async function getDiensten() {
  const diensten = await getCollection("diensten");
  return diensten.sort((a, b) => a.data.volgorde - b.data.volgorde);
}

export const dienstUrl = (id: string) => `/diensten/${id}`;

/** Nette paden zonder ".html" of "/index" (build.format = "file"). */
export const schoonPad = (pathname: string) =>
  pathname.replace(/\.html$/, "").replace(/\/index$/, "").replace(/\/$/, "") || "/";

const escape = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Voorkomt dat "re-integratie" in koppen over twee regels wordt afgebroken.
 * Het gewone koppelteken blijft staan (belangrijk voor zoekmachines); het woord krijgt alleen white-space: nowrap.
 * Geeft veilige HTML terug voor gebruik met set:html.
 */
export const zonderAfbreken = (tekst: string) =>
  escape(tekst).replace(/re-integratie/gi, (m) => `<span class="nowrap">${m}</span>`);
