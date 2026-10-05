# Website AdaptXS

De website van AdaptXS: jobcoaching, re-integratie, arbeidsdeskundig onderzoek en coaching voor ondernemers.
De site is gebouwd met [Astro](https://astro.build), gehost op Cloudflare Pages en te bewerken via Pages CMS.

- **Kosten**: €0 voor hosting, CMS en formulier. Alleen domein en zakelijke e-mail kosten geld.
- **Geen tracking-cookies**, dus geen cookiebanner nodig.
- **Formulieren** worden niet opgeslagen, alleen als e-mail doorgestuurd (via Brevo, EU).

Checklist vóór livegang: **[docs/livegang-checklist.md](docs/livegang-checklist.md)**

---

## Teksten en prijzen aanpassen (zonder code)

1. Ga naar **https://app.pagescms.org** en log in met je GitHub-account.
2. Kies de repository `website-front` en de branch `main`.
3. Links in het menu vind je:
   - **Bedrijfsgegevens**: naam, adres, KvK, btw, SRA-nummer, portretfoto
   - **Tarieven**: alle prijzen op één plek (leeg = "Op aanvraag", 0 = "Gratis")
   - **Diensten**: de vier dienstpagina's, inclusief veelgestelde vragen
   - **Poortwachter-tijdlijn**: de momenten in de interactieve tijdlijn
   - **Homepage**, **Over mij** en **Juridische pagina's**
4. Klik op **Save**. Binnen ongeveer een minuut staat de wijziging live.

**Veiligheidsnet:** bij elke wijziging controleert de site automatisch of er woorden in staan die je bewust niet
gebruikt (mediation/mediator/bemiddeling, lifestyle/wellness/hormonen). Staat zo'n woord erin, dan gaat de
wijziging **niet** live. In Cloudflare Pages zie je dan een mislukte build met de regel waar het woord staat.

**Wat je niet zelf kunt:** nieuwe paginatypes toevoegen of de vormgeving aanpassen. Daarvoor is een wijziging in de code nodig.

### Teksten die nog ingevuld moeten worden
Alles wat nog moet, staat in de teksten als `[INVULLEN: ...]`. Voor een overzicht:

```bash
npm run check:livegang
```

---

## Technisch overzicht (voor de website-bouwer)

```
src/content/diensten/*.md        tekst per dienst (frontmatter + "In het kort")
src/content/juridisch/*.md       privacy, cookies, voorwaarden, klachten
src/content/paginas/over.md      over mij
src/data/site.json               bedrijfsgegevens
src/data/tarieven.json           alle prijzen
src/data/home.json               homepage
src/components/IntakeForm.astro  intakeformulier (één component, dienst vooraf ingevuld)
src/components/SporenHero.astro  hero-animatie "Weer op het spoor" (canvas)
src/components/Logo.astro        logo ADAPTXS als vector, optioneel geanimeerd
src/components/PoortwachterTijdlijn.astro  interactieve tijdlijn (data: src/data/poortwachter.json)
src/components/VerzuimCalculator.astro     verzuimkosten-calculator (logica: src/lib/verzuimkosten.ts)
src/scripts/interactie.ts        scroll-animaties, lichtvlek op kaarten, header
src/server/intake.ts             verwerking formulier → e-mail via Brevo (niets opslaan)
functions/api/intake.ts          Cloudflare Pages Function (POST /api/intake)
src/lib/werkgebied.ts            postcodegebieden voor AD-onderzoek
scripts/check-content.mjs        controle op verboden termen en placeholders
.pages.yml                       configuratie Pages CMS
public/_headers                  beveiligingsheaders (CSP e.d.)
```

### Lokaal ontwikkelen

```bash
npm install
npm run dev              # http://localhost:4321
npm run build            # inhoudscontrole + build naar dist/
npm test                 # unittests + Playwright (pagina's, cookies, toegankelijkheid, formulier)
```

### Cloudflare Pages instellen

| Instelling | Waarde |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |

**Environment variables (Settings → Variables and Secrets):**

| Naam | Waarde | Type |
|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | site key van Turnstile | tekst (nodig tijdens de build) |
| `TURNSTILE_SECRET_KEY` | secret key van Turnstile | geheim |
| `BREVO_API_KEY` | API-sleutel van Brevo | geheim |
| `MAIL_TO` | adres waar aanvragen binnenkomen, bijv. `info@adaptxs.nl` | tekst |
| `MAIL_FROM` | geverifieerd afzenderadres in Brevo, bijv. `website@adaptxs.nl` | tekst |

Cloudflare Web Analytics (cookieloos) zet je aan via **Pages → je project → Metrics → Web Analytics**.
Dit zit in de CSP (`public/_headers`) al toegestaan.

### Huisstijl en beweging
- Kleuren uit het beeldmerk: groen `#0C6D45`, crème `#F3E4D2`, antraciet `#231F20`, salie `#7A9474`.
- Het logo (`src/lib/logo.ts`) is direct uit de PDF van het beeldmerk overgenomen als vector.
- Alle animaties respecteren de instelling "minder beweging" van het apparaat: dan staat alles direct in de eindstand.

### Uitbreiden
- **Nieuwe tool**: pagina onder `src/pages/tools/` en een link in `src/components/Header.astro`.
- **Kennisbank**: nieuwe content collection `kennisbank` in `src/content.config.ts` en een `.pages.yml`-sectie.
