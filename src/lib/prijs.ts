export type Tarief = {
  dienst: string;
  omschrijving: string;
  prijs?: number | string | null;
  vanaf: boolean;
  eenheid: string;
  btw: "excl" | "incl";
  toelichting: string;
};

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Toont een prijs zoals "vanaf € 95 per uur, excl. btw", "Gratis" of "Op aanvraag". */
export function formatPrijs(t: Tarief): string {
  // Een leeg CMS-veld kan als null, undefined of "" worden opgeslagen.
  if (t.prijs === null || t.prijs === undefined || t.prijs === "") return "Op aanvraag";
  const prijs = Number(t.prijs);
  if (Number.isNaN(prijs)) return "Op aanvraag";
  if (prijs === 0) return "Gratis";
  const bedrag = `${t.vanaf ? "vanaf " : ""}${euro.format(prijs)}`;
  const eenheid = t.eenheid ? ` ${t.eenheid}` : "";
  return `${bedrag}${eenheid}, ${t.btw === "incl" ? "incl." : "excl."} btw`;
}
