# Checklist vóór livegang

Vink af wat klaar is. De meeste punten gaan over je bedrijfsvoering, niet over de website: daar zit het grootste AVG-risico.

## 1. Domein en e-mail
- [ ] Zakelijke mailbox op je eigen domein (bijv. Microsoft 365 Business Basic of mailbox.org), mét tweestapsverificatie
- [ ] Geen cliëntcorrespondentie meer via een privé-adres (`@outlook.com`) of WhatsApp
- [ ] SPF, DKIM en DMARC ingesteld in de DNS van je domein (bij GoDaddy), zodat formuliermails niet in de spam belanden
- [ ] SSL-certificaat actief in cPanel (SSL/TLS Status), https://www.adaptxs.com werkt zonder waarschuwing

## 2. Website technisch
- [ ] Uploadmap in `public_html` gezet, inclusief `.htaccess` en `api/intake.php` (zie README)
- [ ] PHP-versie in cPanel op 8.x gezet (minimaal 7.4)
- [ ] cPanel → Email Routing goed ingesteld (Local of Remote Mail Exchanger, zie README)
- [ ] Testaanvraag verstuurd via elk van de 4 dienstpagina's en via /contact, en binnengekomen in je mailbox (niet in spam)
- [ ] Nette URL's werken (bijv. `/diensten` en `/diensten/re-integratie` zonder `.html`)
- [ ] FTP-account (map `public_html`) aangemaakt en `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` als secrets in GitHub gezet
- [ ] Pages CMS gekoppeld en één testwijziging gedaan (bijv. een prijs), die na een paar minuten automatisch live stond
- [ ] `npm run check:livegang` geeft geen open placeholders meer

## 3. Inhoud
- [ ] Naam, adres, KvK-nummer, btw-id en telefoonnummer ingevuld (Bedrijfsgegevens)
- [ ] Afweging gemaakt: woonadres op de site, of een zakelijk adres?
- [ ] SRA-registernummer ingevuld en de link naar het SRA-register gecontroleerd
- [ ] Professionele portretfoto geüpload
- [ ] Tekst "Over mij" geschreven (alleen ervaring die je kunt onderbouwen)
- [ ] Tarieven ingevuld, zakelijk excl. btw en particulier incl. btw
- [ ] **Jobcoaching:** voorwaarden van UWV en gemeente(n) voor externe jobcoaches gecontroleerd en de tekst "Wie betaalt?" daarop aangepast
- [ ] Aanspreekvorm consequent ("je" of "u")

## 4. AVG en privacy
- [ ] Privacyverklaring ingevuld en laten toetsen
- [ ] Per dienst vastgelegd of je verwerkingsverantwoordelijke of verwerker bent
- [ ] Model-verwerkersovereenkomst voor opdrachtgevers (werkgevers) klaar
- [ ] Verwerkersovereenkomsten afgesloten met GoDaddy (hosting), e-mailprovider, Zoom en boekhoudpakket
- [ ] Zoom: dataopslag op de EU-regio
- [ ] Verwerkingsregister (art. 30 AVG) opgesteld
- [ ] Bewaartermijnen vastgelegd (intake-aanvragen, dossiers, facturen)
- [ ] Datalekprocedure en register van datalekken
- [ ] Beveiligd versturen van rapporten geregeld (bijv. Zivver of Proton)
- [ ] Versleutelde laptop en tweestapsverificatie op alle accounts
- [ ] Korte vastlegging waarom een DPIA wel of niet nodig is
- [ ] Privacyreglement en beroepscode van NVvA/SRA gecheckt

## 5. Juridisch
- [ ] Algemene voorwaarden (bij voorkeur het model van de NVvA of opgesteld door een jurist)
- [ ] Klachtenregeling ingevuld, inclusief de actuele klachtenprocedure van de SRA
- [ ] Beroepsaansprakelijkheidsverzekering
- [ ] Naam AdaptXS gecheckt bij KvK en BOIP (merkregister)
- [ ] KvK-nummer en btw-id invullen via het CMS (Bedrijfsgegevens) zodra ze bekend zijn; ze verschijnen dan vanzelf in de footer
- [ ] Definitieve algemene voorwaarden op de pagina zetten (nu staat er een tijdelijke tekst)
