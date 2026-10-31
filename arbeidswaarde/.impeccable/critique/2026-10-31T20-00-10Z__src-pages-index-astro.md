---
target: de homepage
total_score: 22
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 2
target_identity: "file:/home/user/website-front/arbeidswaarde/src/pages/index.astro"
target_fingerprint: "sha256:616b917aeed5b202283ec1ac144cc2c190c0091488af8185e45e91b7feba5f28"
target_path: /home/user/website-front/arbeidswaarde/src/pages/index.astro
timestamp: 2026-10-31T20-00-10Z
slug: src-pages-index-astro
---
⚠️ DEGRADED: single-context (geen hulpagents gestart zonder expliciet verzoek van de gebruiker; beoordeling A afgerond vóór de scan van B)

## Ontwerpgezondheid

| # | Heuristiek | Score | Belangrijkste punt |
|---|---|---|---|
| 1 | Zichtbaarheid van status | 3 | Actieve menupil en gekozen week zijn zichtbaar; de automatische wandeling werkt het voorleesgebied drie keer bij zonder actie van de bezoeker |
| 2 | Aansluiting bij de praktijk | 3 | Taal van de doelgroep; menu-item "De EZWB uitgelegd" gebruikt de afkorting voordat die ergens voluit staat |
| 3 | Controle en vrijheid | 3 | Wandeling stopt bij klik, menu sluit met Escape |
| 4 | Consistentie | 3 | Eén systeem; weekknoppen lijken op kaarten maar werken als schakelaars |
| 5 | Fouten voorkomen | 2 | Nergens staat dat het medische deel bij de eigen bedrijfsarts blijft: verkeerde verwachting ligt op de loer |
| 6 | Herkennen boven herinneren | 3 | Alles zichtbaar, vragen inklapbaar |
| 7 | Flexibiliteit en efficiëntie | n/a | Landingspagina, geen sneltoetsen nodig |
| 8 | Esthetiek en eenvoud | 2 | Venster 44 tot 54 komt vier keer terug; twee identieke kaartsecties; lange pagina met weinig inhoud |
| 9 | Herstel van fouten | n/a | Geen foutsituaties op de homepage |
| 10 | Hulp en uitleg | 3 | Veelgestelde vragen en link naar de uitlegpagina |
| **Totaal** | | **22/32 (69%)** | **Acceptabel, net onder Goed** |

## Eigen karakter

Oordeel: de hero met de route is echt van Arbeidswaarde. Daarna valt de pagina terug op een sjabloon (label boven kop, twee keer drie kaarten met rond icoon, gecentreerde kernzin, genummerde stappen, vragen, donkere oproepkaart) dat elke dienstverlener ongewijzigd kan gebruiken. Gemiste kansen: het product is een schriftelijk advies, maar nergens is te zien hoe dat eruitziet; "persoonlijk en klein" is onzichtbaar.

Scan: broncode 0 (vals schoon, .astro niet goed gelezen). Live pagina (Chromium, 1440 en 390): hero-eyebrow-chip 1, kicker-above-heading 4, cream-palette 1. Statische HTML: cramped-padding 3 (vals alarm, niet in live-scan). cream-palette is vals alarm voor dit project: #F7F4EF is een merkkleur.

## Prioriteiten

1. [P1] Wie screent ontbreekt: onafhankelijk, persoonlijk, arbeidsdeskundige, registratie, ervaring met Ziektewet en UWV staan nergens. Fix: blok "Wie screent uw dossier" direct na de hero. Command: /impeccable clarify
2. [P1] Grens van de dienst onduidelijk: geen medisch oordeel, medisch deel blijft bij de bedrijfsarts van de klant. Fix: zin in "Wat u krijgt" en een vraag "Geven jullie een medisch oordeel?". Command: /impeccable clarify
3. [P2] Sjabloonstructuur: vijf keer label boven kop, twee identieke kaartsecties. Fix: labels weg; "Waarom nu" als korte alinea rond 1 november 2026; "Wat u krijgt" tonen als voorbeeld van het advies zelf. Command: /impeccable bolder
4. [P2] Herhaling en lengte: venster 44 tot 54 vier keer; pagina ongeveer 5000 pixels hoog op 1440. Fix: route draagt het venster; kaart "Een kort venster" en vraag "Wanneer" samenvoegen of schrappen; witruimte tussen secties ongeveer een kwart omlaag. Command: /impeccable distill
5. [P2] Hero vraagt te veel tegelijk: zes keuzes; schermlezer leest tijdens de automatische wandeling drie teksten ongevraagd voor. Fix: voorlezen pas na eerste klik; weekknoppen visueel lichter. Command: /impeccable harden

## Persona's

- Jordan (HR, kleine werkgever, eerste keer): afkorting in menu; geen idee van kosten of duur; "beveiligde route die wij samen afspreken" is vaag.
- Casey (mobiel): route pas onder de vouw; geen telefoonnummer.
- Riley (stresstester): wandeling stopt netjes bij klik; enige contactmogelijkheid is het formulier.
- Ingrid (verzuimcoördinator administratiekantoor, veel dossiers): zoekt of meerdere dossiers tegelijk kunnen, hoe veilig aanleveren gaat, kosten per dossier; vindt niets.
- Bas (bedrijfsarts): zoekt wie beoordeelt en of het medische oordeel bij hem blijft; vindt geen naam, registratie of grens.

## Kleinere punten

- "Goed voorbereid naar de ..." is geen correct Nederlands: "voorbereid op".
- Kleurwissel van de kernzin is zo subtiel dat weinig bezoekers hem zien.
- Oproep onderaan zegt niet wat er na contact gebeurt.
- Voettekst zonder e-mailadres of telefoonnummer (open punt).
- Vijf stappen naast elkaar op 1440 geven smalle kolommen met kleine tekst.

## Vragen

- Wat als de bezoeker het advies zelf ziet in plaats van drie kaarten erover?
- Krijgt "persoonlijk en klein" een gezicht, of blijft het bureau anoniem?
- Wat blijft er over voor de pagina "De EZWB uitgelegd" als de homepage al zoveel uitlegt?
