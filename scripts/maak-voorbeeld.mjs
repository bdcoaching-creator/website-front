#!/usr/bin/env node
/**
 * Maakt van de gebouwde site (dist/) een klikbare voorbeeldversie die zonder server werkt:
 * - alle interne links worden relatief (…/diensten/jobcoaching.html);
 * - het formulier verstuurt niets en toont een melding;
 * - een klein label maakt duidelijk dat het een voorbeeld is.
 *
 * Gebruik: npm run build && node scripts/maak-voorbeeld.mjs <uitvoermap>
 */
import { renameSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const UIT = process.argv[2];
if (!UIT) {
  console.error("Geef een uitvoermap op: node scripts/maak-voorbeeld.mjs <map>");
  process.exit(1);
}

rmSync(UIT, { recursive: true, force: true });
mkdirSync(UIT, { recursive: true });
cpSync(DIST, UIT, { recursive: true });
for (const weg of ["_headers", "robots.txt", "sitemap-0.xml", "sitemap-index.xml"]) rmSync(join(UIT, weg), { force: true });
// Mappen die met "_" beginnen zijn bij sommige hosts gereserveerd: _astro wordt assets.
renameSync(join(UIT, "_astro"), join(UIT, "assets"));

function* bestanden(dir) {
  for (const naam of readdirSync(dir)) {
    const pad = join(dir, naam);
    if (statSync(pad).isDirectory()) yield* bestanden(pad);
    else yield pad;
  }
}

/** Zet een absoluut site-pad om naar een relatief pad naar het juiste .html-bestand. */
function relatief(pad, prefix) {
  const [, basis = "/", rest = ""] = pad.match(/^([^?#]*)(.*)$/) ?? [];
  if (basis === "/") return `${prefix}index.html${rest}`;
  const schoon = basis.replace(/^\//, "").replace(/\/$/, "");
  const heeftExtensie = /\.[a-z0-9]+$/i.test(schoon);
  return `${prefix}${heeftExtensie ? schoon : `${schoon}.html`}${rest}`;
}

const VOORBEELD_SCRIPT = (prefix) => `<script>
  window.__vb = ${JSON.stringify(prefix)};
  // Voorbeeldversie: het formulier verstuurt niets.
  (function () {
    var echteFetch = window.fetch;
    window.fetch = function (url, opties) {
      if (String(url).indexOf("api/intake") !== -1) {
        return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return echteFetch.apply(this, arguments);
    };
  })();
</script>`;

const VOORBEELD_LABEL = `<div class="voorbeeld-label" role="note">Voorbeeldversie · formulieren versturen niets</div>
<style>
  .voorbeeld-label{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:200;
  background:#231f20;color:#f3e4d2;font:500 12px/1.2 "Inter Variable",system-ui,sans-serif;padding:8px 12px;
  border-radius:999px;box-shadow:0 6px 20px rgb(0 0 0 / .25);pointer-events:none}
</style>`;

let aantal = 0;
for (const bestand of bestanden(UIT)) {
  const rel = relative(UIT, bestand);
  if (bestand.endsWith(".css")) {
    // CSS staat in assets/, net als de lettertypen.
    const css = readFileSync(bestand, "utf8").replace(/url\(\/_astro\//g, "url(./");
    writeFileSync(bestand, css);
    continue;
  }
  if (!bestand.endsWith(".html")) continue;

  const diepte = rel.split("/").length - 1;
  const prefix = "../".repeat(diepte);
  let html = readFileSync(bestand, "utf8");

  html = html.replace(/(href|src|action)="(\/[^"]*)"/g, (_, attr, pad) => {
    if (pad.startsWith("//")) return `${attr}="${pad}"`;
    if (pad.startsWith("/_astro/")) return `${attr}="${prefix}assets/${pad.slice("/_astro/".length)}"`;
    if (pad.startsWith("/images/") || pad === "/favicon.svg") return `${attr}="${prefix}${pad.slice(1)}"`;
    if (pad.startsWith("/api/")) return `${attr}="${prefix}${pad.slice(1)}"`;
    return `${attr}="${relatief(pad, prefix)}"`;
  });

  // Paden die in de ingebouwde scripts staan.
  html = html
    .replace(/window\.location\.href=`\/bedankt`/g, 'window.location.href=window.__vb+"bedankt.html"')
    .replace(/`\/diensten\/\$\{(\w+)\.dienst\}`/g, 'window.__vb+"diensten/"+$1.dienst+".html"');

  // Het voorbeeldscript moet vóór de andere scripts draaien.
  html = html.replace(/<\/title>/, `</title>${VOORBEELD_SCRIPT(prefix)}`);
  html = html.replace(/<\/body>/, `${VOORBEELD_LABEL}</body>`);

  // De startpagina wordt bij het publiceren in een eigen skelet gezet: haal de omhulling weg.
  if (rel === "index.html") {
    html = html
      .replace(/<!doctype html>/i, "")
      .replace(/<html[^>]*>/i, "")
      .replace(/<\/html>/i, "")
      .replace(/<head>/i, "")
      .replace(/<\/head>/i, "")
      .replace(/<body>/i, "")
      .replace(/<\/body>/i, "")
      .replace(/<meta charset="utf-8">/i, "")
      .replace(/<meta name="viewport"[^>]*>/i, "");
    // <html class="no-js" lang="nl"> is weg: zet taal en de class "js" via script.
    html = html.replace(
      'document.documentElement.classList.replace("no-js", "js");',
      'document.documentElement.classList.add("js");document.documentElement.lang="nl";',
    );
  }

  writeFileSync(bestand, html);
  aantal++;
}

console.log(`✓ Voorbeeldversie gemaakt in ${UIT} (${aantal} pagina's).`);
