---
target: de homepage
total_score: 24
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 1
target_identity: "file:/home/user/website-front/arbeidswaarde/src/pages/index.astro"
target_fingerprint: "sha256:a8e2d78e1739b2e5ef017bef8e53905eda765af61a045dd8f28c31b4a1d5f7da"
target_path: /home/user/website-front/arbeidswaarde/src/pages/index.astro
timestamp: 2026-10-31T20-19-51Z
slug: src-pages-index-astro
---
⚠️ DEGRADED: single-context (geen hulpagents zonder expliciet verzoek; uitslag van de scan was al gezien tijdens de polish-ronde)

## Ontwerpgezondheid

| # | Heuristiek | Score | Belangrijkste punt |
|---|---|---|---|
| 1 | Zichtbaarheid van status | 3 | Gekozen week en actief menu zichtbaar; geen ongevraagd voorlezen meer |
| 2 | Aansluiting bij de praktijk | 3 | Menu "De EZWB uitgelegd" nog steeds afkorting; "Arbeidskundig" is vakjargon |
| 3 | Controle en vrijheid | 3 | Wandeling stopt bij klik, Escape sluit menu |
| 4 | Consistentie | 3 | Donkere band, oproep en voettekst vormen één ritme |
| 5 | Fouten voorkomen | 3 | Grens medisch en wie aanmeldt staan nu op drie plekken |
| 6 | Herkennen boven herinneren | 3 | Alles zichtbaar |
| 7 | Flexibiliteit en efficiëntie | n/a | Landingspagina |
| 8 | Esthetiek en eenvoud | 3 | Sjabloon in bovenste helft weg; venster nog vaak herhaald, hero heeft zes keuzes |
| 9 | Herstel van fouten | n/a | Geen foutsituaties |
| 10 | Hulp en uitleg | 3 | Vragen inclusief medisch oordeel |
| **Totaal** | | **24/32 (75%)** | **Goed** |

## Eigen karakter

Bovenste helft nu eigen: route, datumband 1 november 2026, adviesvel. Onderste helft (gecentreerde kernzin, vijf stappen op een rij, vragen, donkere oproepkaart) is nog sjabloon; de stappen herhalen deels wat route en adviesvel al laten zien.

Scan: live pagina 1440 en 390 alleen cream-palette (merkkleur, vals alarm). Statische HTML: cramped-padding 11 en dark-glow 1, beide vals alarm.

## Prioriteiten

1. [P1] "Wie screent" is nog een belofte zonder bewijs: geen registratienummer, jaren ervaring, naam of foto. Fix: gegevens aanleveren in home.json. Command: /impeccable clarify
2. [P2] Venster 44 tot 54 nog op vier plekken (route, adviesvel, vraag "Wanneer", oproep). Fix: vraag "Wanneer" schrappen. Command: /impeccable distill
3. [P2] Hero heeft zes keuzes; weekknoppen concurreren met "Neem contact op". Fix: weekknoppen lichter (tekstknoppen met lijn eronder). Command: /impeccable quieter
4. [P2] Onderste helft sjabloon; "Hoe wij werken" overlapt met route en adviesvel. Fix: stappen terug naar vier en als tijdlijn in de stijl van de route; oproep met wat er na contact gebeurt. Command: /impeccable bolder

## Kleinere punten

- Menu-item "De EZWB uitgelegd": afkorting voordat die voluit staat.
- "Arbeidskundig" is vakjargon voor HR.
- Oproep zegt niet wat er na contact gebeurt.

## Vragen

- Komt de arbeidsdeskundige in beeld, of blijft het bureau anoniem?
- Is "Hoe wij werken" nog nodig naast route en adviesvel?
