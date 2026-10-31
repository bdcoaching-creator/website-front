/**
 * Interactieve route in de hero. Alleen transform; bij prefers-reduced-motion en op mobiel
 * springt de figuur direct naar de gekozen week. De automatische wandeling duurt korter dan
 * 5 seconden en stopt zodra de bezoeker zelf een week kiest (WCAG 2.2.2).
 */
const GROND = 290;
const SNELHEID = 150; // eenheden per seconde in de tekening
const x = (week: number) => 60 + ((week - 40) / 14) * 440;
// De figuur stopt net vóór de markering, zodat de wegwijzer zichtbaar blijft.
// Bij week 54 iets verder, zodat hij tussen de palen van week 52 en 54 vrij staat.
const sta = (week: number) => x(week) - (week === 54 ? 30 : 36);
const wacht = (ms: number) => new Promise((r) => setTimeout(r, ms));

const rustig = matchMedia("(prefers-reduced-motion: reduce)");
const breed = matchMedia("(min-width: 60rem)");

const route = document.querySelector<HTMLElement>("[data-route]");
const persoon = route?.querySelector<SVGGElement>("[data-persoon]");
const richting = route?.querySelector<SVGGElement>("[data-richting]");
const uitleg = route?.querySelector<HTMLElement>("[data-route-tekst]");
const knoppen = route ? [...route.querySelectorAll<HTMLButtonElement>("[data-stop]")] : [];

if (route && persoon && richting && uitleg && knoppen.length) {
  const weken = knoppen.map((k) => Number(k.dataset.stop));
  let huidig = weken[weken.length - 1];
  let rit = 0; // telt op bij elke nieuwe beweging, zodat een oude beweging zichzelf afbreekt

  const markeer = (week: number) => {
    knoppen.forEach((k) => k.setAttribute("aria-pressed", String(Number(k.dataset.stop) === week)));
    route.querySelectorAll("[data-punt]").forEach((p) => {
      p.classList.toggle("is-actief", Number((p as SVGElement).dataset.punt) === week);
    });
    const knop = knoppen.find((k) => Number(k.dataset.stop) === week);
    if (knop) uitleg.textContent = knop.dataset.tekst ?? "";
  };

  const zet = (week: number) => {
    persoon.style.transition = "none";
    persoon.style.transform = `translate(${sta(week)}px, ${GROND}px)`;
    persoon.classList.remove("loopt");
    richting.classList.remove("is-terug");
    huidig = week;
  };

  const loop = async (week: number) => {
    const mijnRit = ++rit;
    if (rustig.matches || !breed.matches) {
      zet(week);
      return;
    }
    const duur = (Math.abs(x(week) - x(huidig)) / SNELHEID) * 1000;
    richting.classList.toggle("is-terug", week < huidig);
    persoon.classList.add("loopt");
    persoon.style.transition = `transform ${duur}ms linear`;
    persoon.style.transform = `translate(${sta(week)}px, ${GROND}px)`;
    huidig = week;
    await wacht(duur);
    if (mijnRit !== rit) return;
    persoon.classList.remove("loopt");
    richting.classList.remove("is-terug");
  };

  let handmatig = false;
  knoppen.forEach((knop) => {
    knop.addEventListener("click", () => {
      handmatig = true;
      const week = Number(knop.dataset.stop);
      markeer(week);
      loop(week);
    });
  });

  // Eenmalige wandeling 40 → 44 → 52 → 54 bij het laden (ongeveer 4,4 seconden) (alleen breed scherm en zonder voorkeur voor minder beweging).
  if (!rustig.matches && breed.matches) {
    zet(weken[0]);
    markeer(weken[0]);
    (async () => {
      await wacht(400);
      for (const week of weken.slice(1)) {
        if (handmatig) return;
        markeer(week);
        await loop(week);
        await wacht(500);
      }
    })();
  } else {
    markeer(huidig);
  }
}
