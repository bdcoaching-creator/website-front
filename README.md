# Website AdeptXS

De website van AdeptXS: jobcoaching, re-integratie, arbeidsdeskundig onderzoek en coaching voor ondernemers.
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
| `MAIL_TO` | adres waar aanvragen binnenkomen, bijv. `info@adeptxs.nl` | tekst |
| `MAIL_FROM` | geverifieerd afzenderadres in Brevo, bijv. `website@adeptxs.nl` | tekst |

Cloudflare Web Analytics (cookieloos) zet je aan via **Pages → je project → Metrics → Web Analytics**.
Dit zit in de CSP (`public/_headers`) al toegestaan.

### Uitbreiden
- **Tool of calculator**: nieuwe pagina onder `src/pages/tools/` met een Astro-island voor de interactieve delen.
- **Kennisbank**: nieuwe content collection `kennisbank` in `src/content.config.ts` en een `.pages.yml`-sectie.
