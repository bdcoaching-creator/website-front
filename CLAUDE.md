# Website AdaptXS – werkafspraken voor Claude

De eigenaar is geen ontwikkelaar. Antwoord in het Nederlands, eerlijk en kritisch, en leg uit waarom.

## Hoe wijzigingen live komen
- `main` = de live site. Na elke push naar `main` bouwt `.github/workflows/upload-godaddy.yml` de site en zet hem via
  FTPS in `public_html` bij GoDaddy (cPanel). Controleer na een merge of die run groen is.
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
- AdaptXS is een team: schrijf in de wij-vorm. Noem nooit het aantal teamleden.
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
- Zet nooit wachtwoorden of sleutels in de repository. FTP-gegevens staan als GitHub-secrets.

## Waar staat wat
- Diensten: `src/content/diensten/*.md` · Over ons: `src/content/paginas/over.md` · Homepage: `src/data/home.json`
- Tarieven: `src/data/tarieven.json` · Juridisch: `src/content/juridisch/*.md`
- Opmaak: `src/styles/global.css` en de componenten in `src/components/`
- Handmatige uploadmap (noodgeval): `npm run pakket` → `upload/adaptxs-public_html.zip`
