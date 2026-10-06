import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGINAS = [
  "/",
  "/diensten",
  "/diensten/jobcoaching",
  "/diensten/re-integratie",
  "/diensten/arbeidsdeskundig-onderzoek",
  "/diensten/coaching-voor-ondernemers",
  "/tarieven",
  "/over",
  "/contact",
  "/bedankt",
  "/privacyverklaring",
  "/cookieverklaring",
  "/algemene-voorwaarden",
  "/klachtenregeling",
  "/tools",
  "/tools/poortwachter-tijdlijn",
  "/tools/verzuimkosten-calculator",
];

// Zonder Turnstile-sleutel mag de site geen enkel extern verzoek doen.
const TOEGESTANE_HOSTS = ["localhost"];

for (const pad of PAGINAS) {
  test(`${pad}: laadt, geen cookies, geen externe verzoeken, toegankelijk`, async ({ page, context }) => {
    const extern: string[] = [];
    page.on("request", (r) => {
      const host = new URL(r.url()).hostname;
      if (!TOEGESTANE_HOSTS.includes(host)) extern.push(r.url());
    });

    const res = await page.goto(pad, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "nl");
    await expect(page.locator("h1")).toHaveCount(1);

    expect(await context.cookies()).toEqual([]);
    expect(extern).toEqual([]);

    const scrollBreedte = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollBreedte).toBeLessThanOrEqual(page.viewportSize()!.width);

    const html = (await page.content()).toLowerCase();
    for (const woord of ["mediation", "mediator", "bemiddel", "lifestyle", "wellness"]) {
      expect(html, `verboden term "${woord}"`).not.toContain(woord);
    }

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const ernstig = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    expect(ernstig.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test("dienstpagina: formulier heeft de dienst vooraf ingevuld", async ({ page }) => {
  await page.goto("/diensten/re-integratie");
  await expect(page.locator("#f-dienst")).toHaveValue("re-integratie");
  await expect(page.locator("#f-postcode")).toBeHidden();
});

test("AD-onderzoek: vriendelijke melding buiten werkgebied", async ({ page }) => {
  await page.goto("/diensten/arbeidsdeskundig-onderzoek");
  const melding = page.locator("[data-regio-melding]");
  await page.fill("#f-postcode", "2511 AB");
  await expect(melding).toBeHidden();
  await page.fill("#f-postcode", "9711 AA");
  await expect(melding).toBeVisible();
});

test("contact: dienst uit de URL en organisatievelden alleen voor werkgevers", async ({ page }) => {
  await page.goto("/contact?dienst=arbeidsdeskundig-onderzoek");
  await expect(page.locator("#f-dienst")).toHaveValue("arbeidsdeskundig-onderzoek");
  await expect(page.locator("#f-postcode")).toBeVisible();
  await expect(page.locator("#f-organisatie")).toBeVisible();
  await page.getByLabel("Medewerker", { exact: true }).check();
  await expect(page.locator("#f-organisatie")).toBeHidden();
});

test("formulier: foutmelding bij lege velden, doorsturen na succes", async ({ page }) => {
  let ontvangen = "";
  await page.route("**/api/intake", async (route) => {
    ontvangen = route.request().postData() ?? "";
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/diensten/coaching-voor-ondernemers");
  await page.getByRole("button", { name: "Start met een vrijblijvend kennismakingsgesprek" }).last().click();
  await expect(page.locator("[data-status]")).toContainText("Vul je naam");

  await page.fill("#f-naam", "Test Persoon");
  await page.fill("#f-email", "test@example.nl");
  await page.getByRole("button", { name: "Start met een vrijblijvend kennismakingsgesprek" }).last().click();
  await expect(page).toHaveURL(/\/bedankt/);
  expect(ontvangen).toContain("coaching-voor-ondernemers");
});

test("mobiel menu opent en sluit", async ({ page, isMobile }) => {
  test.skip(!isMobile, "alleen mobiel");
  await page.goto("/");
  const knop = page.getByRole("button", { name: "Menu" });
  const menu = page.locator("#hoofdmenu");
  await expect(menu).toBeHidden();
  await knop.click();
  await expect(menu).toBeVisible();
  await expect(knop).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});

test("hero: animatie draait en het logo staat erin", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero .sporen__canvas")).toBeVisible();
  await expect(page.locator(".hero__logo svg[aria-label='AdaptXS']")).toBeVisible();
  const getekend = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>(".sporen__canvas")!;
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4 * 50) if (d[i] > 0) n++;
    return n;
  });
  expect(getekend).toBeGreaterThan(50);
});

test("minder beweging: geen animaties, inhoud direct zichtbaar", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("[data-reveal]").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".marquee__track")).toHaveCSS("animation-name", "none");
  await context.close();
});

test("Poortwachter-tijdlijn: marker en schuifregelaar tonen het juiste moment", async ({ page }) => {
  await page.goto("/tools/poortwachter-tijdlijn");
  await page.getByRole("button", { name: /Week 42/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-pw-titel]")).toHaveText("Ziekmelding bij het UWV");
  await expect(page.locator("[data-pw-week]")).toHaveText("42");
  await page.locator("[data-pw-slider]").fill("93");
  await expect(page.locator("[data-pw-titel]")).toHaveText("WIA-aanvraag");
  await expect(page.locator("[data-pw-volgende]")).toContainText("Einde loondoorbetaling");
  await page.getByRole("button", { name: "Volgende stap" }).click();
  await expect(page.locator("[data-pw-week]")).toHaveText("104");
  await page.getByRole("button", { name: "Vorige stap" }).click();
  await expect(page.locator("[data-pw-week]")).toHaveText("93");
});

test("verzuimkosten-calculator rekent mee met de invoer", async ({ page }) => {
  await page.goto("/tools/verzuimkosten-calculator");
  await page.fill("#c-salaris", "5200");
  await page.locator("#c-weken").fill("52");
  // 5200 * 12 / 52 * 52 weken * 100% * 1,30 = 81.120
  await expect(page.locator("[data-calc-totaal]")).toHaveText(/81\.120/);
  await expect(page.locator("[data-calc-weken-label]")).toHaveText("52 weken");
});

test("footerlogo onthult één keer van links naar rechts; headerlogo blijft ongewijzigd", async ({ page }) => {
  await page.goto("/diensten");
  const footerLogo = page.locator("[data-footer-logo]");
  const footerSvg = footerLogo.locator("svg");
  await expect(footerSvg).toHaveCSS("clip-path", /inset\(0px 100%/);
  await expect(footerSvg).toHaveCSS("transition-duration", "0.9s");
  await expect(footerSvg).toHaveCSS("transition-timing-function", "ease-out");
  await expect(page.locator(".site-header__logo svg")).toHaveCSS("clip-path", "none");

  await footerLogo.scrollIntoViewIfNeeded();
  await expect(footerLogo).toHaveClass(/is-onthuld/);
  await expect(footerSvg).toHaveCSS("clip-path", "inset(0px)");
});

for (const pad of ["/", "/diensten/re-integratie"]) {
  test(`${pad}: werkwijze-kaarten komen na elkaar in beeld`, async ({ page }) => {
    await page.goto(pad);
    const kaarten = page.locator("[data-stappen] li");
    await expect(kaarten).toHaveCount(4);
    await expect(kaarten.first()).toHaveCSS("opacity", "0");
    const vertragingen = await kaarten.evaluateAll((els) => els.map((el) => getComputedStyle(el).transitionDelay));
    expect(vertragingen.map((v) => v.split(",")[0].trim())).toEqual(["0s", "0.15s", "0.3s", "0.45s"]);

    await page.locator("[data-stappen]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-stappen]")).toHaveClass(/is-zichtbaar/);
    for (let i = 0; i < 4; i++) await expect(kaarten.nth(i)).toHaveCSS("opacity", "1");
    await expect(kaarten.last()).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  });
}

test("minder beweging: footerlogo en werkwijze-kaarten zonder animatie", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/diensten/jobcoaching");
  await expect(page.locator("[data-footer-logo] svg")).toHaveCSS("clip-path", "none");
  const kaarten = page.locator("[data-stappen] li");
  for (let i = 0; i < 4; i++) await expect(kaarten.nth(i)).toHaveCSS("opacity", "1");
  await context.close();
});
