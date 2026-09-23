#!/usr/bin/env node
/**
 * Inhoudscontrole die bij elke build draait.
 *
 * 1. Verboden termen: de build faalt als ze ergens in de content voorkomen.
 *    - mediation/mediator/bemiddeling: geen MfN-registratie, dus nergens gebruiken.
 *    - lifestyle/wellness/hormonen: coaching wordt niet als gezondheidsdienst gepositioneerd.
 * 2. Placeholders ("[INVULLEN: ...]"): standaard alleen een waarschuwing.
 *    Met --strict (npm run check:livegang) faalt de controle, zodat er niets half-ingevuld live gaat.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN_DIRS = ["src", "functions"];
const EXTENSIONS = [".md", ".json", ".astro", ".ts", ".mjs"];
const strict = process.argv.includes("--strict");

const VERBODEN = [
  { regex: /mediat(ion|or|ors)/i, reden: "geen MfN-registratie: geen mediation of mediator-terminologie" },
  { regex: /bemiddel/i, reden: "geen MfN-registratie: vermijd 'bemiddeling'" },
  { regex: /life\s?style/i, reden: "coaching niet als lifestyle/wellness positioneren" },
  { regex: /wellness/i, reden: "coaching niet als lifestyle/wellness positioneren" },
  { regex: /hormo(on|nen|naal)/i, reden: "coaching niet als gezondheidsdienst positioneren" },
];
const PLACEHOLDER = /\[INVULLEN[^\]]*\]/g;

function* bestanden(dir) {
  for (const naam of readdirSync(dir)) {
    const pad = join(dir, naam);
    if (statSync(pad).isDirectory()) yield* bestanden(pad);
    else if (EXTENSIONS.some((ext) => pad.endsWith(ext))) yield pad;
  }
}

const fouten = [];
const placeholders = [];

for (const dir of SCAN_DIRS) {
  let pad;
  try {
    pad = join(ROOT, dir);
    statSync(pad);
  } catch {
    continue;
  }
  for (const bestand of bestanden(pad)) {
    const rel = relative(ROOT, bestand);
    readFileSync(bestand, "utf8")
      .split("\n")
      .forEach((regel, i) => {
        for (const { regex, reden } of VERBODEN) {
          if (regex.test(regel)) fouten.push(`${rel}:${i + 1}  "${regel.trim().slice(0, 80)}"  → ${reden}`);
        }
        for (const m of regel.matchAll(PLACEHOLDER)) placeholders.push(`${rel}:${i + 1}  ${m[0]}`);
      });
  }
}

if (fouten.length) {
  console.error(`\n✖ Verboden termen gevonden (${fouten.length}):\n  ${fouten.join("\n  ")}\n`);
}

if (placeholders.length) {
  const log = strict ? console.error : console.warn;
  log(`\n${strict ? "✖" : "⚠"} Nog in te vullen (${placeholders.length}):\n  ${placeholders.join("\n  ")}\n`);
}

if (fouten.length || (strict && placeholders.length)) process.exit(1);
console.log(`✓ Inhoudscontrole geslaagd${placeholders.length ? ` (${placeholders.length} placeholders nog open)` : ""}.`);
