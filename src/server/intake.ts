/**
 * Verwerking van het intakeformulier (draait als Cloudflare Pages Function).
 *
 * Privacy by design:
 * - er wordt niets opgeslagen: het bericht gaat alleen als e-mail naar MAIL_TO;
 * - er wordt niets gelogd met persoonsgegevens;
 * - alleen de velden uit het formulier worden geaccepteerd, met harde lengtegrenzen.
 */

export interface Env {
  BREVO_API_KEY?: string;
  MAIL_TO?: string;
  MAIL_FROM?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export const DIENSTEN: Record<string, string> = {
  jobcoaching: "Jobcoaching",
  "re-integratie": "Re-integratie",
  "arbeidsdeskundig-onderzoek": "Arbeidsdeskundig onderzoek",
  "coaching-voor-ondernemers": "Coaching voor ondernemers",
  anders: "Iets anders / weet ik nog niet",
};
const ROLLEN: Record<string, string> = {
  werkgever: "Werkgever",
  medewerker: "Medewerker",
  ondernemer: "Ondernemer of zzp'er",
};

const LIMIETEN = {
  naam: 100,
  email: 150,
  telefoon: 30,
  organisatie: 120,
  medewerkers: 20,
  postcode: 40,
  bericht: 500,
} as const;

export type Aanvraag = {
  rol: string;
  naam: string;
  email: string;
  telefoon: string;
  dienst: string;
  organisatie: string;
  medewerkers: string;
  postcode: string;
  bericht: string;
};

type Validatie = { ok: true; aanvraag: Aanvraag } | { ok: false; fout: string };

const schoon = (waarde: FormDataEntryValue | null, max: number) =>
  String(waarde ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function valideer(form: FormData): Validatie {
  const aanvraag: Aanvraag = {
    rol: schoon(form.get("rol"), 20),
    naam: schoon(form.get("naam"), LIMIETEN.naam),
    email: schoon(form.get("email"), LIMIETEN.email),
    telefoon: schoon(form.get("telefoon"), LIMIETEN.telefoon),
    dienst: schoon(form.get("dienst"), 40),
    organisatie: schoon(form.get("organisatie"), LIMIETEN.organisatie),
    medewerkers: schoon(form.get("medewerkers"), LIMIETEN.medewerkers),
    postcode: schoon(form.get("postcode"), LIMIETEN.postcode),
    bericht: schoon(form.get("bericht"), LIMIETEN.bericht),
  };

  if (!aanvraag.naam) return { ok: false, fout: "Vul je naam in." };
  if (!EMAIL_RE.test(aanvraag.email)) return { ok: false, fout: "Vul een geldig e-mailadres in." };
  if (!(aanvraag.dienst in DIENSTEN)) return { ok: false, fout: "Kies een dienst." };
  if (!(aanvraag.rol in ROLLEN)) aanvraag.rol = "";
  if (aanvraag.rol !== "werkgever") {
    aanvraag.organisatie = "";
    aanvraag.medewerkers = "";
  }
  if (aanvraag.dienst !== "arbeidsdeskundig-onderzoek") aanvraag.postcode = "";
  return { ok: true, aanvraag };
}

export function maakMail(a: Aanvraag) {
  const regels = [
    `Nieuwe aanvraag via de website`,
    ``,
    `Dienst:       ${DIENSTEN[a.dienst]}`,
    `Rol:          ${ROLLEN[a.rol] ?? "-"}`,
    `Naam:         ${a.naam}`,
    `E-mail:       ${a.email}`,
    `Telefoon:     ${a.telefoon || "-"}`,
  ];
  if (a.rol === "werkgever") {
    regels.push(`Organisatie:  ${a.organisatie || "-"}`, `Medewerkers:  ${a.medewerkers || "-"}`);
  }
  if (a.dienst === "arbeidsdeskundig-onderzoek") regels.push(`Werkplek:     ${a.postcode || "-"}`);
  regels.push(``, `Bericht:`, a.bericht || "-", ``, `—`, `Bewaar deze aanvraag niet langer dan nodig (zie privacyverklaring).`);
  return {
    onderwerp: `Aanvraag ${DIENSTEN[a.dienst]}: ${a.naam}`.slice(0, 150),
    tekst: regels.join("\n"),
  };
}

async function checkTurnstile(token: string, secret: string, ip: string | null, doFetch: typeof fetch) {
  if (!token) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await doFetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return data.success === true;
}

function antwoord(request: Request, status: number, fout?: string): Response {
  const wilJson = (request.headers.get("Accept") ?? "").includes("application/json");
  if (wilJson) {
    return new Response(JSON.stringify(fout ? { ok: false, fout } : { ok: true }), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  // Zonder JavaScript: terugsturen naar een pagina.
  const doel = fout ? `/contact?fout=${encodeURIComponent(fout)}` : "/bedankt";
  return new Response(null, { status: 303, headers: { Location: doel } });
}

export async function verwerkAanvraag(request: Request, env: Env, doFetch: typeof fetch = fetch): Promise<Response> {
  const lengte = Number(request.headers.get("Content-Length") ?? 0);
  if (lengte > 20_000) return antwoord(request, 413, "Het bericht is te groot.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return antwoord(request, 400, "Het formulier kon niet worden gelezen.");
  }

  // Honeypot: bots vullen dit verborgen veld in. Doe alsof het gelukt is.
  if (schoon(form.get("website"), 200)) return antwoord(request, 200);

  const resultaat = valideer(form);
  if (!resultaat.ok) return antwoord(request, 400, resultaat.fout);

  if (env.TURNSTILE_SECRET_KEY) {
    const token = schoon(form.get("cf-turnstile-response"), 2048);
    const mens = await checkTurnstile(token, env.TURNSTILE_SECRET_KEY, request.headers.get("CF-Connecting-IP"), doFetch);
    if (!mens) return antwoord(request, 400, "De spamcontrole is mislukt. Probeer het opnieuw.");
  }

  if (!env.BREVO_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) {
    return antwoord(request, 503, "Het formulier is tijdelijk niet beschikbaar. Mail je vraag naar info@adaptxs.nl.");
  }

  const { onderwerp, tekst } = maakMail(resultaat.aanvraag);
  const res = await doFetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM, name: "Website AdaptXS" },
      to: [{ email: env.MAIL_TO }],
      replyTo: { email: resultaat.aanvraag.email, name: resultaat.aanvraag.naam },
      subject: onderwerp,
      textContent: tekst,
    }),
  });

  if (!res.ok) {
    console.error(`Versturen mislukt: mailprovider gaf status ${res.status}`);
    return antwoord(request, 502, "Er ging iets mis bij het versturen. Probeer het later opnieuw of mail naar info@adaptxs.nl.");
  }
  return antwoord(request, 200);
}
