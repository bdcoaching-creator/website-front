// Tests van het formulierscript public/api/contact.php. Vereist PHP op de computer.
// Draaien: node --test tests/
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BRON = new URL("../public/api/contact.php", import.meta.url).pathname;
const POORT_LEEG = 4491;
const POORT_INGESTELD = 4492;
const werk = mkdtempSync(join(tmpdir(), "arbeidswaarde-test-"));
const postvak = join(werk, "post");
const servers = [];

function maakSite(naam, mailTo) {
  const map = join(werk, naam, "api");
  mkdirSync(map, { recursive: true });
  let php = readFileSync(BRON, "utf8");
  if (mailTo) {
    php = php
      .replace("const MAIL_TO = '';", `const MAIL_TO = '${mailTo}';`)
      .replace("const MAIL_FROM = '';", "const MAIL_FROM = 'website@voorbeeld.nl';");
  }
  writeFileSync(join(map, "contact.php"), php);
  return join(werk, naam);
}

function start(poort, root) {
  const vang = join(werk, "vang.sh");
  writeFileSync(vang, `#!/bin/sh\ncat > "${postvak}/$(date +%s%N).eml"\n`);
  chmodSync(vang, 0o755);
  const s = spawn("php", ["-d", `sendmail_path=${vang}`, "-S", `127.0.0.1:${poort}`, "-t", root], {
    env: { ...process.env, TMPDIR: join(werk, `tmp-${poort}`) },
    stdio: "ignore",
  });
  mkdirSync(join(werk, `tmp-${poort}`), { recursive: true });
  servers.push(s);
}

async function post(poort, velden, { json = true } = {}) {
  const res = await fetch(`http://127.0.0.1:${poort}/api/contact.php`, {
    method: "POST",
    body: new URLSearchParams(velden),
    headers: json ? { Accept: "application/json" } : {},
    redirect: "manual",
  });
  return { status: res.status, data: json ? await res.json() : null, locatie: res.headers.get("location") };
}

const geldig = { naam: "Sam de Vries", email: "sam@voorbeeld.nl", telefoon: "", bericht: "Een vraag over een dossier." };
const aantalMails = () => readdirSync(postvak).length;

before(async () => {
  execFileSync("php", ["-l", BRON]);
  mkdirSync(postvak, { recursive: true });
  start(POORT_LEEG, maakSite("leeg", ""));
  start(POORT_INGESTELD, maakSite("ingesteld", "ontvanger@voorbeeld.nl"));
  await new Promise((r) => setTimeout(r, 600));
});
after(() => servers.forEach((s) => s.kill()));

test("weigert andere methoden dan POST", async () => {
  const res = await fetch(`http://127.0.0.1:${POORT_LEEG}/api/contact.php`, { headers: { Accept: "application/json" } });
  assert.equal(res.status, 405);
});

test("geeft per veld een foutmelding", async () => {
  const { status, data } = await post(POORT_LEEG, { naam: "", email: "fout@", telefoon: "abc", bericht: "" });
  assert.equal(status, 422);
  assert.deepEqual(Object.keys(data.velden).sort(), ["bericht", "email", "naam", "telefoon"]);
});

test("verstuurt niets en zegt dat eerlijk zolang er geen ontvanger is ingesteld", async () => {
  const { status, data } = await post(POORT_LEEG, geldig);
  assert.equal(status, 503);
  assert.equal(data.ok, false);
});

test("verstuurt een geldig bericht en bevestigt pas daarna", async () => {
  const voor = aantalMails();
  const { status, data } = await post(POORT_INGESTELD, { ...geldig, onderwerp: "afspraak" });
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  assert.equal(aantalMails(), voor + 1);
});

test("honeypot ingevuld: er wordt niets verstuurd", async () => {
  const voor = aantalMails();
  await post(POORT_INGESTELD, { ...geldig, hp_controle: "http://spam.example" });
  assert.equal(aantalMails(), voor);
});

test("regeleinden in de naam kunnen geen extra mailkoppen toevoegen", async () => {
  const voor = aantalMails();
  await post(POORT_INGESTELD, { ...geldig, naam: "Sam\r\nBcc: iemand@voorbeeld.nl" });
  assert.equal(aantalMails(), voor + 1);
  const laatste = readdirSync(postvak).sort().at(-1);
  const mail = readFileSync(join(postvak, laatste), "utf8");
  assert.ok(!/^Bcc:/im.test(mail));
});

test("zonder JavaScript: doorsturen naar de bevestigingspagina", async () => {
  const { status, locatie } = await post(POORT_INGESTELD, geldig, { json: false });
  assert.equal(status, 303);
  assert.equal(locatie, "/contact/verzonden/");
});

test("na vijf berichten per uur volgt een nette weigering", async () => {
  // Eerdere tests op deze server telden al mee; ga door tot de grens is bereikt.
  let status = 200;
  for (let i = 0; i < 6 && status !== 429; i++) ({ status } = await post(POORT_INGESTELD, geldig));
  assert.equal(status, 429);
});
