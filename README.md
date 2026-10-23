# Website AdaptXS

De website van AdaptXS: jobcoaching, re-integratie, arbeidsdeskundig onderzoek en coaching voor ondernemers.
De site is gebouwd met [Astro](https://astro.build), gehost bij GoDaddy (cPanel) en te bewerken via Pages CMS.

- **Kosten**: geen extra kosten naast je GoDaddy-hosting, domein en e-mail. CMS en formulier zijn gratis.
- **Geen tracking-cookies**, dus geen cookiebanner nodig.
- **Formulieren** worden niet opgeslagen, alleen als e-mail doorgestuurd (PHP-script op de eigen hosting).

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
   - **Homepage**, **Over ons** en **Juridische pagina's**
4. Klik op **Save**. GitHub bouwt de site daarna automatisch en zet hem bij GoDaddy. Na een paar minuten staat de
   wijziging live. Je ziet de voortgang op GitHub onder **Actions** → *Upload naar GoDaddy*
   (zie [Automatische upload](#automatische-upload-github--godaddy)).

**Veiligheidsnet:** bij elke wijziging controleert de site automatisch of er woorden in staan die je bewust niet
gebruikt (mediation/mediator/bemiddeling, lifestyle/wellness/hormonen). Staat zo'n woord erin, dan gaat de
wijziging **niet** live: de automatische upload stopt dan (rood kruisje onder **Actions**) met de regel waar het
woord staat. De vorige versie blijft gewoon online.

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
src/content/paginas/over.md      over ons
src/data/site.json               bedrijfsgegevens
src/data/tarieven.json           alle prijzen
src/data/home.json               homepage
src/components/IntakeForm.astro  intakeformulier (één component, dienst vooraf ingevuld)
src/components/SporenHero.astro  hero-animatie "Weer op het spoor" (canvas)
src/components/Logo.astro        logo ADAPTXS als vector, optioneel geanimeerd
src/components/PoortwachterTijdlijn.astro  interactieve tijdlijn (data: src/data/poortwachter.json)
src/components/VerzuimCalculator.astro     verzuimkosten-calculator (logica: src/lib/verzuimkosten.ts)
src/scripts/interactie.ts        scroll-animaties, lichtvlek op kaarten, header
public/api/intake.php            verwerking formulier → e-mail via mail() van de hosting (niets opslaan)
src/lib/werkgebied.ts            postcodegebieden voor AD-onderzoek
scripts/check-content.mjs        controle op verboden termen en placeholders
.pages.yml                       configuratie Pages CMS
public/.htaccess                 Apache: nette URL's, https + www, beveiligingsheaders (CSP e.d.), caching
scripts/maak-pakket.mjs          maakt de uploadmap upload/public_html en een zip
```

### Lokaal ontwikkelen

```bash
npm install
npm run dev              # http://localhost:4321
npm run build            # inhoudscontrole + build naar dist/
npm test                 # PHP-formuliertests (vereist PHP) + Playwright (pagina's, cookies, toegankelijkheid)
npm run pakket           # build + uploadklare map upload/public_html en upload/adaptxs-public_html.zip
```

### Automatische upload (GitHub → GoDaddy)

`.github/workflows/upload-godaddy.yml` draait bij elke wijziging op `main` (ook vanuit Pages CMS): inhoudscontrole,
build, test van het formulierscript en daarna upload van `dist/` via **SSH (poort 22)** naar `public_html`
(`scripts/upload-ssh.sh`). FTP/FTPS (poort 21) werkt niet vanaf GitHub naar deze hosting.
Bestaande bestanden worden overschreven; mappen van de hosting zelf (`.well-known`, `cgi-bin`) blijven staan.
Oude bestanden in `_astro` worden opgeruimd. Een pagina die van de site verdwijnt, haal je zelf weg in File Manager.
Handmatig starten kan via **Actions** → *Upload naar GoDaddy* → **Run workflow**.

**Eenmalig instellen**
1. GoDaddy → **My Hosting** → adaptxs.com → **Settings** (of *Server*) → **SSH Access** aanzetten.
2. cPanel → **SSH Access** → **Manage SSH Keys** → **Generate a New Key** (RSA, 4096). Daarna bij de nieuwe sleutel
   onder *Public Keys* → **Manage** → **Authorize**. Onder *Private Keys* → **View/Download** de private sleutel kopiëren.
3. GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   `SSH_HOST` (bijv. `adaptxs.com`), `SSH_USER` (cPanel-gebruikersnaam), `SSH_PRIVATE_KEY` (de hele private sleutel,
   inclusief de regels `-----BEGIN` en `-----END`) en `SSH_PASSPHRASE` (het wachtwoord van de sleutel).
4. **Actions** → *Upload naar GoDaddy* → **Run workflow**, en controleer de site.

Zonder deze secrets bouwt en controleert GitHub de site wel, maar uploadt niets.
"Shell access is not enabled": GoDaddy heeft shell-toegang nog niet aangezet. Het script probeert dan SFTP;
lukt ook dat niet, zet SSH Access (opnieuw) aan bij GoDaddy of vraag GoDaddy-support om shell-toegang.
"Geen SSH-verbinding": SSH-toegang staat nog uit, of gebruik als `SSH_HOST` de servernaam uit cPanel
(*General Information* → *Server Name*). Zet de controle van de servervingerafdruk niet uit.

### Handmatig uploaden naar GoDaddy (cPanel)

1. `npm run pakket` maakt `upload/adaptxs-public_html.zip` (inhoud = wat in `public_html` hoort, inclusief `.htaccess`).
2. cPanel → **File Manager** → `public_html`. Zet via **Settings** "Show Hidden Files (dotfiles)" aan.
3. Maak eerst een back-up van wat er al staat (selecteer alles → **Compress**), verwijder daarna de oude bestanden.
   Laat `.well-known` en `cgi-bin` staan.
4. **Upload** de zip, klik er met rechts op → **Extract** naar `/public_html`, en verwijder daarna de zip.
5. Controleer: https://www.adaptxs.com, https://www.adaptxs.com/diensten/re-integratie en een testaanvraag.

**Formulier (`public/api/intake.php`):** stuurt met `mail()` van de hosting naar `info@adaptxs.com`. Ontvanger en
afzender staan bovenin het script. Er zijn geen API-sleutels of geheimen nodig. Spam wordt tegengehouden met een
verborgen veld (honeypot), een controle op herkomst en een limiet van 5 aanvragen per uur per bezoeker.

**E-mail komt niet aan?** Controleer in cPanel → **Email Routing**: staat je mailbox in cPanel, kies *Local Mail
Exchanger*; staat je mail bij een andere dienst (bijv. Microsoft 365), kies *Remote Mail Exchanger*. Controleer ook
of het SPF-record van je domein de server van GoDaddy toestaat.

### Huisstijl en beweging
- Kleuren uit het beeldmerk: groen `#0C6D45`, crème `#F3E4D2`, antraciet `#231F20`, salie `#7A9474`.
- Lettertypen: koppen in **Californian FB** als die op het apparaat van de bezoeker staat, anders de gratis, verwante
  Goudy-letter **Sorts Mill Goudy** (zelf gehost). Lopende tekst, navigatie en knoppen in **Inter**.
  Californian FB is een commercieel lettertype: zet het alleen als webfont op de site met een webfont-licentie.
- Het logo (`src/lib/logo.ts`) is direct uit de PDF van het beeldmerk overgenomen als vector.
- Alle animaties respecteren de instelling "minder beweging" van het apparaat: dan staat alles direct in de eindstand.

### Uitbreiden
- **Nieuwe tool**: pagina onder `src/pages/tools/` en een link in `src/components/Header.astro`.
- **Kennisbank**: nieuwe content collection `kennisbank` in `src/content.config.ts` en een `.pages.yml`-sectie.
