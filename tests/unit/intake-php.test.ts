/**
 * Test van public/api/intake.php met de ingebouwde PHP-server.
 * mail() schrijft via een nep-sendmail naar een bestand, zodat we de verstuurde mail kunnen controleren.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const heeftPhp = spawnSync("php", ["-v"]).status === 0;
const POORT = 8097;
const BASIS = `http://127.0.0.1:${POORT}`;
const geldig = { rol: "werkgever", naam: "Jan Jansen", email: "jan@example.nl", dienst: "re-integratie", organisatie: "Bakkerij", medewerkers: "10–24", bericht: "Medewerker is ziek.\nGraag contact." };

let server: ChildProcess;
let werkmap = "";
let mailBestand = "";

before(async () => {
  if (!heeftPhp) return;
  werkmap = mkdtempSync(join(tmpdir(), "adaptxs-php-"));
  mailBestand = join(werkmap, "mail.txt");
  const sendmail = join(werkmap, "sendmail.sh");
  writeFileSync(sendmail, `#!/bin/sh\ncat > "${mailBestand}"\n`);
  chmodSync(sendmail, 0o755);
  server = spawn("php", ["-d", `sendmail_path=${sendmail}`, "-d", `sys_temp_dir=${werkmap}`, "-S", `127.0.0.1:${POORT}`, "-t", "public"], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`${BASIS}/robots.txt`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
});

after(() => {
  server?.kill();
  if (werkmap) rmSync(werkmap, { recursive: true, force: true });
});

function verstuur(velden: Record<string, string>, headers: Record<string, string> = { Accept: "application/json" }) {
  return fetch(`${BASIS}/api/intake.php`, { method: "POST", body: new URLSearchParams(velden), headers, redirect: "manual" });
}

const opties = { skip: heeftPhp ? false : "PHP is niet geïnstalleerd" };

test("intake.php: geldige aanvraag verstuurt een mail met reply-to", opties, async () => {
  rmSync(mailBestand, { force: true });
  const res = await verstuur(geldig);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  const mail = readFileSync(mailBestand, "utf8");
  assert.match(mail, /^To: info@adaptxs\.com/m);
  assert.match(mail, /^Reply-To: jan@example\.nl/m);
  assert.match(mail, /^From: =\?UTF-8\?B\?[^?]+\?= <info@adaptxs\.com>/m);
  const onderwerp = mail.match(/^Subject: =\?UTF-8\?B\?([^?]+)\?=/m)?.[1] ?? "";
  assert.equal(Buffer.from(onderwerp, "base64").toString("utf8"), "Aanvraag Re-integratie: Jan Jansen");
  const tekst = mail.split(/\r?\n\r?\n/).slice(1).join("\n\n").replace(/=\r?\n/g, "");
  assert.match(tekst, /Organisatie:  Bakkerij/);
  assert.match(tekst, /Graag contact\./);
});

test("intake.php: zonder JavaScript doorsturen naar /bedankt", opties, async () => {
  const res = await verstuur({ ...geldig, dienst: "jobcoaching" }, {});
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/bedankt");
});

test("intake.php: foutmeldingen bij ontbrekende of ongeldige velden", opties, async () => {
  const geval = async (velden: Record<string, string>, fout: RegExp) => {
    const res = await verstuur(velden);
    assert.equal(res.status, 400);
    assert.match((await res.json()).fout, fout);
  };
  await geval({ ...geldig, naam: "" }, /naam/);
  await geval({ ...geldig, email: "geen-adres" }, /e-mailadres/);
  await geval({ ...geldig, dienst: "mediation" }, /dienst/);
});

test("intake.php: geen header-injectie via naam of e-mail", opties, async () => {
  rmSync(mailBestand, { force: true });
  const res = await verstuur({ ...geldig, email: "jan@example.nl\r\nBcc: spam@example.org" });
  assert.equal(res.status, 400);
  assert.equal(existsSync(mailBestand), false);

  const res2 = await verstuur({ ...geldig, naam: "Jan\r\nBcc: spam@example.org" });
  assert.equal(res2.status, 200);
  assert.doesNotMatch(readFileSync(mailBestand, "utf8"), /^Bcc:/m);
});

test("intake.php: honeypot ingevuld = niets versturen, wel 'gelukt'", opties, async () => {
  rmSync(mailBestand, { force: true });
  const res = await verstuur({ ...geldig, website: "http://spam.example" });
  assert.equal(res.status, 200);
  assert.equal(existsSync(mailBestand), false);
});

test("intake.php: velden die niet bij rol of dienst horen gaan niet mee", opties, async () => {
  rmSync(mailBestand, { force: true });
  await verstuur({ ...geldig, rol: "medewerker", postcode: "1234 AB" });
  const mail = readFileSync(mailBestand, "utf8");
  assert.doesNotMatch(mail, /Organisatie|Werkplek/);
});

test("intake.php: alleen POST en alleen vanaf de eigen site", opties, async () => {
  const get = await fetch(`${BASIS}/api/intake.php`);
  assert.equal(get.status, 405);
  const vreemd = await verstuur(geldig, { Accept: "application/json", Origin: "https://andere-site.example" });
  assert.equal(vreemd.status, 403);
});

// Als laatste: de limiet per uur (alle verzoeken komen van 127.0.0.1).
test("intake.php: na te veel aanvragen per uur volgt een vriendelijke melding", opties, async () => {
  let laatste: Response | undefined;
  for (let i = 0; i < 6; i++) laatste = await verstuur(geldig);
  assert.equal(laatste!.status, 429);
  assert.match((await laatste!.json()).fout, /over een uur/);
});
