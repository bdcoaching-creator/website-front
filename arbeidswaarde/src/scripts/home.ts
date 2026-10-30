/**
 * Interacties op de homepage. Alleen transform, opacity en kleur; geen bibliotheken.
 * Bij prefers-reduced-motion: geen beweging en direct de eindstand.
 * Op mobiel (smaller dan 60rem) alleen de kernzin; de hero-vorm en de magnetische knop staan stil.
 */
const rustig = matchMedia("(prefers-reduced-motion: reduce)");
const breed = matchMedia("(min-width: 60rem)");
const fijneAanwijzer = matchMedia("(pointer: fine)");

/* Kernzin: woorden kleuren een voor een van saliegroen naar dennengroen. */
function kernzin() {
  const zin = document.querySelector<HTMLElement>("[data-kernzin]");
  if (!zin || rustig.matches) return;
  const woorden = [...zin.querySelectorAll<HTMLElement>(".kernzin__woord")];
  zin.setAttribute("data-actief", "");

  let gepland = false;
  const werkBij = () => {
    gepland = false;
    const vh = window.innerHeight;
    const top = zin.getBoundingClientRect().top;
    // Begint als de zin onderin beeld komt, klaar als hij op ongeveer een derde van boven staat.
    const voortgang = Math.min(1, Math.max(0, (vh * 0.9 - top) / (vh * 0.55)));
    const aantal = Math.round(voortgang * woorden.length);
    woorden.forEach((w, i) => w.classList.toggle("is-aan", i < aantal));
  };
  const plan = () => {
    if (!gepland) {
      gepland = true;
      requestAnimationFrame(werkBij);
    }
  };
  werkBij();
  window.addEventListener("scroll", plan, { passive: true });
  window.addEventListener("resize", plan);
}

/* Hero-vorm: lagen bewegen zacht mee met scrollen (alleen breed scherm). */
function zweef() {
  const lagen = [...document.querySelectorAll<SVGGElement>("[data-zweef]")];
  const beeld = document.querySelector<HTMLElement>(".hero__beeld");
  if (!lagen.length || !beeld) return;

  let gepland = false;
  const werkBij = () => {
    gepland = false;
    const actief = breed.matches && !rustig.matches;
    const y = actief ? Math.min(window.scrollY, 900) : 0;
    lagen.forEach((laag) => {
      const factor = Number(laag.dataset.zweef) || 0;
      laag.style.transform = actief ? `translate3d(0, ${(y * factor).toFixed(1)}px, 0)` : "";
    });
    beeld.style.opacity = actief ? String(1 - Math.min(y / 1400, 0.3)) : "";
  };
  const plan = () => {
    if (!gepland) {
      gepland = true;
      requestAnimationFrame(werkBij);
    }
  };
  werkBij();
  window.addEventListener("scroll", plan, { passive: true });
  breed.addEventListener("change", werkBij);
  rustig.addEventListener("change", werkBij);
}

/* Magnetische hoofdknop: beweegt hooguit 6 pixels mee met de muis. */
function magneet() {
  const knop = document.querySelector<HTMLElement>("[data-magneet]");
  if (!knop) return;
  const MAX = 6;
  knop.style.transition = "transform 240ms cubic-bezier(0.2, 0.7, 0.2, 1), background-color 160ms";

  knop.addEventListener("pointermove", (e) => {
    if (!breed.matches || !fijneAanwijzer.matches || rustig.matches) return;
    const r = knop.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    knop.style.transform = `translate(${(dx * MAX).toFixed(1)}px, ${(dy * MAX * 0.6).toFixed(1)}px)`;
  });
  knop.addEventListener("pointerleave", () => {
    knop.style.transform = "";
  });
}

kernzin();
zweef();
magneet();
