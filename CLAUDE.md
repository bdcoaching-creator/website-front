# AdaptXS – onboarding en werkafspraken voor Claude

**Lees `brand/brand-context.md` vóór elk merkwerk** (teksten, posts, beelden, presentaties, nieuwe pagina's).

## Wie ik ben
Ik ben Brigitte Dijksteel, eigenaar van AdaptXS: re-integratiecoach en coach voor ondernemers.
Naar buiten gebruiken AdaptXS en ik het woord "lifestyle" nooit (zie `brand/stem.md`).
Ik start mijn onderneming binnen vier maanden, heb geen startkapitaal en ben geen ontwikkelaar.

## Hoe ik werk gedaan wil hebben
- Antwoord in het Nederlands, eerlijk en kritisch. Ben het niet automatisch met me eens.
- Zeg je nee of ben je kritisch, leg dan uit waarom. Is iets goed, zeg kort waarom.
- Daag me uit en kom met originele, out-of-the-boxideeën.
- Reken met een klein budget: gratis of goedkoop eerst, en zeg wat iets kost.
- Leg stappen voor mij uit zoals voor een niet-ontwikkelaar: waar ik moet klikken, in welke volgorde.
- Verzin niets. Ontbreekt informatie, vraag het me. Bij een echte keuze: geef je aanbeveling en vraag.
- Voer alleen uit wat ik vraag; betere ideeën noteer je apart als aanbeveling.

## Hoe wijzigingen live komen
- `main` = de live site. Na elke push naar `main` bouwt `.github/workflows/upload-godaddy.yml` de site en zet hem via
  SSH (poort 22, `scripts/upload-ssh.sh`) in `public_html` bij GoDaddy (cPanel). Controleer na een merge of die run groen is.
- Werk op een eigen branch, maak een pull request naar `main` en voeg pas samen als de eigenaar dat vraagt.
- Teksten en prijzen kan de eigenaar ook zelf wijzigen via Pages CMS (`.pages.yml`); die wijzigingen komen ook op `main`.

## Vóór elke push
```bash
npm run build                      # inhoudscontrole (verboden termen) + build
node --test tests/unit/*.test.ts   # tests van het formulierscript (PHP)
npx astro preview --port 4321 &    # daarna: npx playwright test
```
Pas tests aan als teksten bewust veranderen (bijv. SEO-titels en H1's in `tests/e2e/site.spec.ts`).

## Inhoudsregels (niet onderhandelbaar)
- Nooit: mediation, mediator, bemiddeling, lifestyle, wellness, hormonen (`scripts/check-content.mjs` bewaakt dit).
- AdaptXS is een team: website en bedrijfsteksten in de wij-vorm. Posts op LinkedIn/Instagram in de ik-vorm (Brigitte),
  alleen met haar eigen ervaring. Noem nooit het aantal teamleden.
- De UWV-ervaring (zes jaar) hoort alleen bij de re-integratiebegeleider. Niet "UWV-expert" of "UWV-specialist".
- Verzin niets: geen testimonials, cijfers, klantlogo's, registratienummers of ervaring die niet is aangeleverd.
  Ontbreekt informatie, vraag erom. Gebruik geen "[INVULLEN]" op de live site.
- Aanspreekvorm "je". Doelgroep: MKB-werkgevers met 2–50 medewerkers; coaching is voor ondernemers en zzp'ers.
- Bedrijfsgegevens staan op één plek: `src/data/site.json` (adres, telefoon, e-mail, KvK, btw, SRA-nummer).

## Privacy en techniek
- Geen tracking, geen cookies, geen externe scripts, lettertypen of embeds (Playwright-test controleert dit).
  Wordt er toch een externe dienst toegevoegd, pas dan ook de privacy- en cookieverklaring aan.
- Het formulier (`public/api/intake.php`) slaat niets op en verstuurt via `mail()` van de hosting naar info@adaptxs.com.
  Vraag nooit om medische gegevens in formulieren.
- Apache-instellingen (nette URL's, https + www, headers, CSP) staan in `public/.htaccess`.
- Animaties respecteren `prefers-reduced-motion`. Houd de site toegankelijk (WCAG 2.1 AA; axe-test).
- Zet nooit wachtwoorden of sleutels in de repository. SSH-gegevens staan als GitHub-secrets.

## Waar staat wat
- Merk: `brand/` (start bij `brand/brand-context.md`; daarnaast business, klanten, stem, visuele stijl)
- Diensten: `src/content/diensten/*.md` · Over ons: `src/content/paginas/over.md` · Homepage: `src/data/home.json`
- Tarieven: `src/data/tarieven.json` · Juridisch: `src/content/juridisch/*.md`
- Opmaak: `src/styles/global.css` en de componenten in `src/components/`
- Handmatige uploadmap (noodgeval): `npm run pakket` → `upload/adaptxs-public_html.zip`
