/**
 * Contactformulier: validatie in de browser, foutmeldingen bij het veld en verzenden met fetch.
 * "Verzonden" verschijnt alleen als de server { ok: true } terugstuurt.
 * Zonder JavaScript post het formulier gewoon naar de server (zie public/api/contact.php).
 */
type Fouten = Partial<Record<"naam" | "telefoon" | "email" | "bericht", string>>;

const formulier = document.querySelector<HTMLFormElement>("[data-formulier]");
const melding = document.querySelector<HTMLElement>("[data-melding]");
const bevestiging = document.querySelector<HTMLElement>("[data-bevestiging]");
const knop = document.querySelector<HTMLButtonElement>("[data-verstuur]");

if (formulier && melding && bevestiging && knop) {
  const veld = (naam: string) => formulier.elements.namedItem(naam) as HTMLInputElement | HTMLTextAreaElement;
  const velden = ["naam", "telefoon", "email", "bericht"] as const;
  const knopTekst = knop.textContent ?? "";
  let geprobeerd = false;

  const controleer = (): Fouten => {
    const f: Fouten = {};
    const naam = veld("naam").value.trim();
    const telefoon = veld("telefoon").value.trim();
    const email = veld("email").value.trim();
    const bericht = veld("bericht").value.trim();
    if (!naam) f.naam = "Vul uw naam in.";
    if (!email) f.email = "Vul uw e-mailadres in.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) f.email = "Vul een geldig e-mailadres in, bijvoorbeeld naam@bedrijf.nl.";
    if (telefoon && !/^\+?[0-9 ()-]{8,20}$/.test(telefoon)) f.telefoon = "Vul een geldig telefoonnummer in, of laat dit veld leeg.";
    if (!bericht) f.bericht = "Schrijf een bericht.";
    return f;
  };

  const toon = (fouten: Fouten) => {
    velden.forEach((naam) => {
      const el = veld(naam);
      const fout = formulier.querySelector<HTMLElement>(`[data-fout-voor="${naam}"]`);
      const tekst = fouten[naam];
      if (tekst) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
      if (fout) {
        fout.textContent = tekst ?? "";
        fout.hidden = !tekst;
      }
    });
  };

  const meld = (tekst: string) => {
    melding.textContent = tekst;
    melding.hidden = !tekst;
  };

  const foutAlgemeen = () => {
    const email = formulier.dataset.foutEmail;
    return `Het versturen is niet gelukt. Probeer het later opnieuw${email ? ` of mail naar ${email}` : ""}.`;
  };

  // Na de eerste poging: fouten bijwerken terwijl de bezoeker typt.
  velden.forEach((naam) => {
    veld(naam).addEventListener("input", () => {
      if (geprobeerd) toon(controleer());
    });
  });

  formulier.addEventListener("submit", async (e) => {
    e.preventDefault();
    geprobeerd = true;
    meld("");
    const fouten = controleer();
    toon(fouten);
    const eerste = velden.find((n) => fouten[n]);
    if (eerste) {
      veld(eerste).focus();
      return;
    }

    knop.disabled = true;
    knop.setAttribute("aria-busy", "true");
    knop.textContent = "Bezig met versturen";
    let focusOpVeld = false;
    try {
      const res = await fetch(formulier.action, {
        method: "POST",
        body: new FormData(formulier),
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.ok === true) {
        formulier.hidden = true;
        bevestiging.hidden = false;
        bevestiging.querySelector<HTMLElement>("[data-bevestiging-kop]")?.focus();
        return;
      }
      if (data && data.velden && Object.keys(data.velden).length) {
        toon(data.velden as Fouten);
        const serverEerste = velden.find((n) => data.velden[n]);
        if (serverEerste) {
          veld(serverEerste).focus();
          focusOpVeld = true;
        }
      }
      meld(data && typeof data.fout === "string" ? data.fout : foutAlgemeen());
    } catch {
      meld(foutAlgemeen());
    } finally {
      knop.disabled = false;
      knop.removeAttribute("aria-busy");
      knop.textContent = knopTekst;
      // Een uitgeschakelde knop verliest de focus; zet die terug zodat toetsenbordgebruikers verder kunnen.
      if (!focusOpVeld && !formulier.hidden) knop.focus();
    }
  });

  // Knop "Maak een afspraak": vult het onderwerp in en brengt de bezoeker naar het formulier.
  document.querySelectorAll<HTMLAnchorElement>("[data-afspraak]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const onderwerp = formulier.querySelector<HTMLInputElement>("[data-onderwerp]");
      const uitleg = formulier.querySelector<HTMLElement>("[data-afspraak-melding]");
      if (onderwerp) onderwerp.value = "afspraak";
      if (uitleg) uitleg.hidden = false;
      formulier.hidden = false;
      bevestiging.hidden = true;
      veld("naam").focus();
    });
  });
}
