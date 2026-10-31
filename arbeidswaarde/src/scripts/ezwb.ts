/**
 * Interacties op "De EZWB uitgelegd". Alleen transform en tekst; geen bibliotheken.
 * Weekbalk: vult zich bij scrollen op breed scherm; op mobiel en bij prefers-reduced-motion direct vol.
 * Tellers: lopen één keer op als ze in beeld komen (ook op mobiel); bij prefers-reduced-motion direct de eindstand.
 */
const rustig = matchMedia("(prefers-reduced-motion: reduce)");
const breed = matchMedia("(min-width: 60rem)");

function weekbalk() {
  const balk = document.querySelector<HTMLElement>("[data-weekbalk]");
  const vulling = document.querySelector<HTMLElement>("[data-weekbalk-vulling]");
  if (!balk || !vulling) return;

  let gepland = false;
  const werkBij = () => {
    gepland = false;
    if (rustig.matches || !breed.matches) {
      vulling.style.transform = "";
      return;
    }
    const vh = window.innerHeight;
    const top = balk.getBoundingClientRect().top;
    // Leeg als de balk onderin beeld komt, vol als hij op ongeveer een derde van boven staat.
    const voortgang = Math.min(1, Math.max(0, (vh * 0.9 - top) / (vh * 0.55)));
    vulling.style.transform = `scaleX(${voortgang.toFixed(3)})`;
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
  breed.addEventListener("change", werkBij);
  rustig.addEventListener("change", werkBij);
}

function tellers() {
  const getallen = [...document.querySelectorAll<HTMLElement>("[data-teller]")];
  if (!getallen.length || rustig.matches || !("IntersectionObserver" in window)) return;
  const nl = (n: number) => Math.round(n).toLocaleString("nl-NL");
  const DUUR = 1400;

  const loopOp = (el: HTMLElement) => {
    const doel = Number(el.dataset.teller);
    const start = performance.now();
    const stap = (nu: number) => {
      const t = Math.min(1, (nu - start) / DUUR);
      const zacht = 1 - Math.pow(1 - t, 3);
      el.textContent = nl(doel * zacht);
      if (t < 1) requestAnimationFrame(stap);
    };
    requestAnimationFrame(stap);
  };

  const kijker = new IntersectionObserver(
    (items) => {
      items.forEach((item) => {
        if (!item.isIntersecting) return;
        kijker.unobserve(item.target);
        loopOp(item.target as HTMLElement);
      });
    },
    { threshold: 0.6 },
  );
  getallen.forEach((el) => {
    // Op nul zetten en laten oplopen zodra het getal in beeld is; wat al in beeld staat, loopt direct op.
    el.textContent = "0";
    kijker.observe(el);
  });
}

weekbalk();
tellers();
