# Website Arbeidswaarde (in opbouw)

Losse Astro-site in deze map. Staat bewust **niet** op `main`: die branch is de live site van AdaptXS.
Later verhuizen naar een eigen repository.

```bash
cd arbeidswaarde
npm install
npm run dev        # http://localhost:4321
npm run build      # naar arbeidswaarde/dist/
```

Let op: zolang deze map in de AdaptXS-repository staat, moet ook in de hoofdmap `npm ci` gedraaid zijn.
De build leest anders de TypeScript-instellingen van de bovenliggende map en faalt.

## Waar staat wat
- Kleuren, lettertypen, ruimte: `src/styles/tokens.css`
- Naam, belofte, menu en contactgegevens: `src/data/site.json`
- Header met pilmenu: `src/components/Header.astro` · Voettekst: `src/components/Footer.astro`
- Tijdelijk logo (nagetekend): `src/components/Logo.astro` en `public/favicon.svg`

Open punten staan in de code als `[NOG TE CONTROLEREN]`.
