/** Algemene interactie: scroll-animaties, lichtvlek op kaarten en de header. */

const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 1. Scroll-animaties: elementen met [data-reveal] of .stripe-divider komen in beeld.
const teOnthullen = document.querySelectorAll<HTMLElement>("[data-reveal], .stripe-divider");
if (rustig || !("IntersectionObserver" in window)) {
  teOnthullen.forEach((el) => el.classList.add("is-visible"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  teOnthullen.forEach((el) => io.observe(el));
}

// Kinderen van [data-reveal-group] krijgen automatisch een oplopende vertraging.
document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((groep) => {
  [...groep.children].forEach((kind, i) => (kind as HTMLElement).style.setProperty("--i", String(i)));
});

// 2. Lichtvlek die de muis volgt op kaarten.
if (window.matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll<HTMLElement>(".card--link").forEach((kaart) => {
    kaart.addEventListener("pointermove", (e) => {
      const r = kaart.getBoundingClientRect();
      kaart.style.setProperty("--mx", `${e.clientX - r.left}px`);
      kaart.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

// 3. Header: krijgt schaduw na scrollen en verbergt zich bij omlaag scrollen.
const header = document.querySelector<HTMLElement>(".site-header");
if (header) {
  let vorige = window.scrollY;
  let bezig = false;
  window.addEventListener(
    "scroll",
    () => {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        header.classList.toggle("is-scrolled", y > 12);
        const menuOpen = header.querySelector(".site-nav.is-open");
        const focusBinnen = header.contains(document.activeElement);
        header.classList.toggle("is-hidden", !rustig && !menuOpen && !focusBinnen && y > vorige && y > 240);
        vorige = y;
        bezig = false;
      });
    },
    { passive: true },
  );
}
