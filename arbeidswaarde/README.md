# Website Arbeidswaarde

Statische Astro-site van drie pagina's (Home, De EZWB uitgelegd, Contact), plus privacyverklaring en 404.
Staat bewust **niet** op `main`: die branch is de live site van AdaptXS. Later verhuizen naar een eigen repository.

```bash
cd arbeidswaarde
npm install
npm run dev             # http://localhost:4321
npm run build           # naar dist/ (zonder ongecontroleerde cijfers)
npm run build:concept   # naar dist-concept/, toont ook cijfers met "Nog te controleren"
npm test                # 8 tests van het formulierscript (vereist PHP)
```

Zolang deze map in de AdaptXS-repository staat, moet ook in de hoofdmap `npm ci` gedraaid zijn; de build leest
anders de TypeScript-instellingen van de bovenliggende map en faalt.

Uploaden: de inhoud van `dist/` (inclusief `.htaccess` en `api/contact.php`) in de webmap van de hosting zetten.
De hosting moet PHP met een werkende `mail()` hebben en in de EU staan.

## Checklist voor het definitief maken

Aan te leveren door de eigenaar:

- [ ] Logo als SVG (nu een nagetekend tijdelijk logo in `src/components/Logo.astro` en `public/favicon.svg`)
- [ ] Domeinnaam (`astro.config.mjs` en `public/robots.txt`; nu `www.arbeidswaarde.nl`)
- [ ] E-mailadres en telefoonnummer (`src/data/site.json`, verschijnen dan vanzelf in voettekst en contactpagina)
- [ ] KvK-nummer (`src/data/site.json`)
- [ ] Ontvanger en afzender van het formulier: `MAIL_TO` en `MAIL_FROM` in `public/api/contact.php`
      (afzender op het eigen domein, anders komt de mail in de spam)
- [ ] Bestemming van de knop "Maak een afspraak" (nu: naar het formulier met onderwerp "afspraak")
- [ ] Gegevens arbeidsdeskundige: registratienummer, jaren ervaring, eventueel naam en foto (`src/data/home.json`, blok `wie`)
- [ ] Privacyverklaring aanvullen (`src/pages/privacy.astro`), daarna `CONCEPT = false` zetten en `/privacy` uit
      het sitemapfilter in `astro.config.mjs` halen

Te controleren tegen de bron (in de code gemarkeerd als `[NOG TE CONTROLEREN]`):

- [ ] Alle feiten over de EZWB in `src/data/home.json` en `src/data/ezwb.json` tegen uwv.nl
- [ ] Cijfers in `src/data/ezwb.json`: per cijfer `gecontroleerd: true` zetten, en bij de bron `geraadpleegd` invullen (JJJJ-MM-DD)
- [ ] Datum 1 november 2026 (homepage, blok "Waarom nu")

Na livegang:

- [ ] Formulier testen met een echt bericht (komt het binnen, niet in de spam?)
- [ ] Een niet-bestaand adres openen: verschijnt de eigen 404-pagina?
- [ ] `.htaccess` uitbreiden met https-doorverwijzing en beveiligingsheaders zodra de hosting bekend is

## Waar staat wat

- Teksten: `src/data/home.json`, `src/data/ezwb.json`, `src/data/site.json`
- Kleuren, lettertypen, ruimte: `src/styles/tokens.css` · basisstijl: `src/styles/global.css`
- Header met pilmenu: `src/components/Header.astro` · voettekst: `src/components/Footer.astro`
- Homepage: `src/components/home/` (route in de hero: `Route.astro` en `src/scripts/route.ts`)
- Uitlegpagina: `src/pages/ezwb-uitgelegd.astro` en `src/components/ezwb/`
- Contact: `src/pages/contact.astro`, `src/components/contact/Formulier.astro`, `src/scripts/contact.ts`, `public/api/contact.php`
- Productcontext voor Impeccable: `PRODUCT.md` · beoordelingen: `.impeccable/critique/`
