/**
 * Globale postcodegebieden voor "Zuid-Holland en omgeving" (werkplekbezoek bij AD-onderzoek).
 * Ruim gekozen: Zuid-Holland plus aangrenzende regio's. Pas aan als je werkgebied verandert.
 */
export const WERKGEBIED_POSTCODES: [number, number][] = [
  [2000, 3999],
  [4200, 4299],
];

/** true = binnen werkgebied, false = erbuiten, null = geen (volledige) postcode herkend. */
export function valtBinnenWerkgebied(invoer: string): boolean | null {
  const match = invoer.trim().match(/^(\d{4})/);
  if (!match) return null;
  const cijfers = Number(match[1]);
  if (cijfers < 1000) return null;
  return WERKGEBIED_POSTCODES.some(([van, tot]) => cijfers >= van && cijfers <= tot);
}
