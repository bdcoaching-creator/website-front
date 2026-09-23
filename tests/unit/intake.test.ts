import { test } from "node:test";
import assert from "node:assert/strict";
import { verwerkAanvraag, valideer, maakMail } from "../../src/server/intake.ts";
import { formatPrijs } from "../../src/lib/prijs.ts";
import { valtBinnenWerkgebied } from "../../src/lib/werkgebied.ts";

const env = { BREVO_API_KEY: "test", MAIL_TO: "info@adeptxs.nl", MAIL_FROM: "website@adeptxs.nl" };

function formulier(velden: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(velden)) fd.append(k, v);
  return fd;
}
const geldig = { rol: "werkgever", naam: "Jan Jansen", email: "jan@example.nl", dienst: "re-integratie", organisatie: "Bakkerij", medewerkers: "10–24", bericht: "Medewerker is ziek." };

function verzoek(velden: Record<string, string>, json = true) {
  return new Request("https://www.adeptxs.nl/api/intake", {
    method: "POST",
    body: formulier(velden),
    headers: json ? { Accept: "application/json" } : {},
  });
}

function nepFetch(status = 201) {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response("{}", { status });
  }) as unknown as typeof fetch;
  return { f, calls };
}

test("valideer: verplichte velden", () => {
  assert.equal(valideer(formulier({ ...geldig, naam: "" })).ok, false);
  assert.equal(valideer(formulier({ ...geldig, email: "geen-email" })).ok, false);
  assert.equal(valideer(formulier({ ...geldig, dienst: "mediation" })).ok, false);
  assert.equal(valideer(formulier(geldig)).ok, true);
});

test("valideer: dataminimalisatie en lengtegrenzen", () => {
  const r = valideer(formulier({ ...geldig, rol: "medewerker", postcode: "2511", bericht: "x".repeat(900) }));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.aanvraag.organisatie, "", "organisatie alleen bij werkgever");
  assert.equal(r.aanvraag.postcode, "", "postcode alleen bij AD-onderzoek");
  assert.equal(r.aanvraag.bericht.length, 500);
});

test("maakMail: bevat alleen relevante velden", () => {
  const r = valideer(formulier({ ...geldig, dienst: "arbeidsdeskundig-onderzoek", postcode: "2611 AB" }));
  assert.ok(r.ok);
  if (!r.ok) return;
  const { onderwerp, tekst } = maakMail(r.aanvraag);
  assert.match(onderwerp, /Arbeidsdeskundig onderzoek: Jan Jansen/);
  assert.match(tekst, /Werkplek:\s+2611 AB/);
  assert.match(tekst, /Organisatie:\s+Bakkerij/);
});

test("verwerkAanvraag: verstuurt mail via Brevo met reply-to", async () => {
  const { f, calls } = nepFetch();
  const res = await verwerkAanvraag(verzoek(geldig), env, f);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.brevo.com/v3/smtp/email");
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.to[0].email, "info@adeptxs.nl");
  assert.equal(body.replyTo.email, "jan@example.nl");
});

test("verwerkAanvraag: honeypot verstuurt niets maar meldt succes", async () => {
  const { f, calls } = nepFetch();
  const res = await verwerkAanvraag(verzoek({ ...geldig, website: "spam" }), env, f);
  assert.equal(res.status, 200);
  assert.equal(calls.length, 0);
});

test("verwerkAanvraag: zonder JavaScript volgt een redirect", async () => {
  const { f } = nepFetch();
  const ok = await verwerkAanvraag(verzoek(geldig, false), env, f);
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get("Location"), "/bedankt");
  const fout = await verwerkAanvraag(verzoek({ ...geldig, email: "x" }, false), env, f);
  assert.equal(fout.status, 303);
  assert.match(fout.headers.get("Location") ?? "", /^\/contact\?fout=/);
});

test("verwerkAanvraag: ontbrekende configuratie en mislukte mail", async () => {
  const { f } = nepFetch();
  assert.equal((await verwerkAanvraag(verzoek(geldig), {}, f)).status, 503);
  const kapot = nepFetch(500);
  assert.equal((await verwerkAanvraag(verzoek(geldig), env, kapot.f)).status, 502);
});

test("verwerkAanvraag: Turnstile wordt gecontroleerd als het geheim is ingesteld", async () => {
  const calls: string[] = [];
  const f = (async (url: string) => {
    calls.push(url);
    if (url.includes("turnstile")) return new Response(JSON.stringify({ success: false }));
    return new Response("{}", { status: 201 });
  }) as unknown as typeof fetch;
  const res = await verwerkAanvraag(verzoek({ ...geldig, "cf-turnstile-response": "abc" }), { ...env, TURNSTILE_SECRET_KEY: "s" }, f);
  assert.equal(res.status, 400);
  assert.equal(calls.length, 1, "geen mail bij mislukte spamcontrole");
});

test("formatPrijs", () => {
  const basis = { dienst: "x", omschrijving: "x", vanaf: false, eenheid: "per uur", btw: "excl" as const, toelichting: "" };
  assert.equal(formatPrijs({ ...basis, prijs: null }), "Op aanvraag");
  assert.equal(formatPrijs({ ...basis, prijs: "" }), "Op aanvraag");
  assert.equal(formatPrijs({ ...basis, prijs: 0 }), "Gratis");
  assert.equal(formatPrijs({ ...basis, prijs: 95, vanaf: true }).replace(/\s/g, " "), "vanaf € 95 per uur, excl. btw");
});

test("valtBinnenWerkgebied", () => {
  assert.equal(valtBinnenWerkgebied("2511 AB"), true); // Den Haag
  assert.equal(valtBinnenWerkgebied("3011"), true); // Rotterdam
  assert.equal(valtBinnenWerkgebied("9711 AA"), false); // Groningen
  assert.equal(valtBinnenWerkgebied("Leiden"), null);
});
