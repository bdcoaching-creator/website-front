#!/usr/bin/env node
/**
 * Maakt van de gebouwde site (dist/) een uploadklare map voor public_html op cPanel-hosting:
 * - upload/public_html/            de bestanden zelf (inclusief .htaccess en api/intake.php)
 * - upload/adaptxs-public_html.zip dezelfde inhoud als zip, om in één keer te uploaden
 *
 * Gebruik: npm run pakket
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const UIT = join(ROOT, "upload");
const MAP = join(UIT, "public_html");
const ZIP = join(UIT, "adaptxs-public_html.zip");

for (const nodig of ["index.html", "404.html", ".htaccess", "api/intake.php"]) {
  if (!existsSync(join(DIST, nodig))) {
    console.error(`dist/${nodig} ontbreekt. Draai eerst npm run build.`);
    process.exit(1);
  }
}

rmSync(UIT, { recursive: true, force: true });
mkdirSync(UIT, { recursive: true });
cpSync(DIST, MAP, { recursive: true });

// De inhoud staat in de root van de zip, zodat uitpakken in public_html direct goed staat.
execFileSync("zip", ["-r", "-q", "-X", ZIP, "."], { cwd: MAP });
console.log(`Klaar:\n  ${MAP}\n  ${ZIP}`);
