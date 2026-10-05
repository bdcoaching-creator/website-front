export type VerzuimInvoer = {
  /** Bruto maandsalaris in euro's. */
  maandsalaris: number;
  /** Duur van het verzuim in weken (1–104). */
  weken: number;
  /** Percentage loondoorbetaling in het eerste jaar (wettelijk minimaal 70, vaak 100 via cao). */
  jaar1: number;
  /** Percentage loondoorbetaling in het tweede jaar. */
  jaar2: number;
  /** Opslag voor werkgeverslasten, vakantiegeld e.d. in procenten. */
  opslag: number;
  /** Overige kosten per week (vervanging, productieverlies). */
  overigPerWeek: number;
};

export type VerzuimUitkomst = {
  loonJaar1: number;
  loonJaar2: number;
  overig: number;
  totaal: number;
  perWeek: number;
};

const getal = (x: number, min = 0, max = Number.POSITIVE_INFINITY) =>
  Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : 0;

/** Indicatieve berekening van de kosten van verzuim voor een werkgever. */
export function berekenVerzuimkosten(invoer: VerzuimInvoer): VerzuimUitkomst {
  const maand = getal(invoer.maandsalaris);
  const weken = Math.round(getal(invoer.weken, 0, 104));
  const opslag = 1 + getal(invoer.opslag, 0, 100) / 100;
  const weekloon = (maand * 12) / 52;

  const wekenJaar1 = Math.min(weken, 52);
  const wekenJaar2 = Math.max(0, weken - 52);

  const loonJaar1 = weekloon * wekenJaar1 * (getal(invoer.jaar1, 0, 100) / 100) * opslag;
  const loonJaar2 = weekloon * wekenJaar2 * (getal(invoer.jaar2, 0, 100) / 100) * opslag;
  const overig = weken * getal(invoer.overigPerWeek);
  const totaal = loonJaar1 + loonJaar2 + overig;

  return { loonJaar1, loonJaar2, overig, totaal, perWeek: weken ? totaal / weken : 0 };
}
