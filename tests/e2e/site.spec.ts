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
