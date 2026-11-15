import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { emptyWorkspace, type Workspace } from "../src/lib/types";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

test.setTimeout(120000);
async function ready(page: Page, path = "/demo") {
  await page.goto(path);
  await expect(page.locator(".skeleton")).toHaveCount(0);
  await expect(page.locator("#main-content h1")).toBeVisible();
}
async function newTransaction(
  page: Page,
  name: string,
  amount: string,
  kind = "expense",
) {
  await page.getByRole("button", { name: "Yeni işlem", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("İşlem türü").selectOption(kind);
  await dialog.getByLabel("İşlem adı", { exact: true }).fill(name);
  await dialog.getByLabel("Tutar (TL)", { exact: true }).fill(amount);
  if (kind !== "transfer")
    await dialog
      .getByLabel("Kategori", { exact: true })
      .selectOption({ label: kind === "income" ? "Maaş" : "Market" });
  return dialog;
}
const demoData = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("kasaflow-demo-v1") ?? "null",
      ) as Workspace | null,
  );

test("protected pages, auth setup state and cross-origin protection", async ({
  page,
  request,
}) => {
  await page.goto("/app/transactions");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("button", { name: "Giriş yap", exact: true }),
  ).toBeDisabled();
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: "Hesap oluştur", exact: true }),
  ).toBeDisabled();
  await page.goto("/forgot-password");
  await expect(
    page.getByRole("button", { name: "Sıfırlama bağlantısı gönder" }),
  ).toBeDisabled();
  const forged = await request.post("/api/mutate", {
    headers: { Origin: "https://example-attacker.test" },
    data: { entity: "delete", data: {} },
  });
  expect(forged.status()).toBe(403);
  const workspace = await request.get(
    "/api/workspace?start=2024-01-01&end=2024-01-31",
  );
  expect(workspace.status()).toBe(503);
});
test("free text expense, inline category, persistence, edit and confirmed deletion", async ({
  page,
}) => {
  await ready(page, "/demo/transactions");
  const dialog = await newTransaction(
    page,
    "QA Kedimin özel maması",
    "1.250,50",
  );
  await dialog.getByRole("button", { name: "Yeni kategori oluştur" }).click();
  await dialog.getByLabel("Yeni kategori adı").fill("QA Evcil Hayvan");
  await dialog.getByRole("button", { name: "Ekle", exact: true }).click();
  await expect(dialog.getByLabel("Kategori", { exact: true })).toHaveValue(
    /.+/,
  );
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel("İşlemlerde ara").fill("QA Kedimin");
  let row = page
    .getByTestId("transaction-row")
    .filter({ hasText: "QA Kedimin özel maması" });
  await expect(row).toContainText("1.250,50");
  await expect(row).toContainText("QA Evcil Hayvan");
  await page.reload();
  await expect(page.locator(".skeleton")).toHaveCount(0);
  await page.getByLabel("İşlemlerde ara").fill("QA Kedimin");
  row = page
    .getByTestId("transaction-row")
    .filter({ hasText: "QA Kedimin özel maması" });
  await expect(row).toBeVisible();
  await row
    .getByRole("button", { name: "QA Kedimin özel maması düzenle" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Tutar (TL)", { exact: true })
    .fill("999,99");
  await page.getByRole("button", { name: "Değişiklikleri kaydet" }).click();
  await expect(row).toContainText("999,99");
  await row.getByRole("button", { name: "QA Kedimin özel maması sil" }).click();
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "QA Kedimin özel maması sil" }).click();
  await page.getByRole("button", { name: "Evet, sil" }).click();
  await expect(row).toHaveCount(0);
});
test("income, account creation and transfer conserve total assets", async ({
  page,
}) => {
  await ready(page);
  const oldBalance = await page.getByTestId("total-balance").innerText();
  const income = await newTransaction(
    page,
    "QA Freelance gelir",
    "10.000,00",
    "income",
  );
  await income.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(income).toHaveCount(0);
  await expect(page.getByTestId("total-balance")).not.toHaveText(oldBalance);
  await ready(page, "/demo/accounts");
  await page.getByRole("button", { name: "Yeni hesap", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Ad", { exact: true }).fill("QA Yeni cüzdan");
  await dialog
    .getByLabel("Başlangıç bakiyesi (TL)", { exact: true })
    .fill("1.250,50");
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "QA Yeni cüzdan", exact: true }),
  ).toBeVisible();
  await ready(page);
  const before = await page.getByTestId("total-balance").innerText();
  dialog = await newTransaction(
    page,
    "QA Hesap transferi",
    "1.000,00",
    "transfer",
  );
  await dialog
    .getByLabel("Hedef hesap", { exact: true })
    .selectOption({ label: "QA Yeni cüzdan" });
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("total-balance")).toHaveText(before);
  const d = await demoData(page);
  expect(
    d?.transactions.filter((t) => t.name === "QA Hesap transferi"),
  ).toHaveLength(1);
  expect(
    d?.transactions.find((t) => t.name === "QA Freelance gelir")?.amount,
  ).toBe(1000000);
});
test("budgets, filters, CSV and report periods work", async ({ page }) => {
  await ready(page, "/demo/budgets");
  await page.getByRole("button", { name: "Yeni bütçe", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Ad", { exact: true }).fill("QA Aylık plan");
  await dialog.getByLabel("Tutar (TL)", { exact: true }).fill("10.000,00");
  await dialog
    .getByLabel("Kategori", { exact: true })
    .selectOption({ label: "Market" });
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "QA Aylık plan", exact: true }),
  ).toBeVisible();
  await ready(page, "/demo/transactions");
  await page.getByLabel("İşlem türü filtresi").selectOption("expense");
  await page.getByRole("button", { name: "Filtreler", exact: true }).click();
  await page
    .getByLabel("Kategori", { exact: true })
    .selectOption({ label: "Market" });
  await page.getByLabel("En düşük tutar (TL)").fill("1.000,00");
  await page.getByLabel("En yüksek tutar (TL)").fill("3.000,00");
  expect(await page.getByTestId("transaction-row").count()).toBeGreaterThan(0);
  await expect(page.getByTestId("transaction-row").first()).toContainText(
    "Market",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV indir" }).click();
  expect((await download).suggestedFilename()).toBe("kasaflow-islemler.csv");
  await ready(page, "/demo/reports");
  await page
    .getByLabel("Tarih filtresi", { exact: true })
    .selectOption("Geçen ay");
  await expect(
    page.getByRole("heading", { name: "Kategori analizi" }),
  ).toBeVisible();
  await page.getByLabel("Grafik dönemi", { exact: true }).selectOption("month");
  await expect(page.locator(".recharts-bar").first()).toBeVisible();
  await page
    .getByLabel("Tarih filtresi", { exact: true })
    .selectOption("Özel aralık");
  const dates = page.getByRole("dialog");
  await dates
    .getByLabel("Başlangıç tarihi", { exact: true })
    .fill("2024-01-01");
  await dates.getByLabel("Bitiş tarihi", { exact: true }).fill("2024-01-31");
  await dates.getByRole("button", { name: "Uygula" }).click();
  await expect(page.locator(".custom-range-label")).toContainText("2024");
});
test("recurrence is planned separately, realized once, history survives rule deletion", async ({
  page,
}) => {
  await ready(page, "/demo/recurring");
  await page.getByRole("button", { name: "Yeni plan", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Ad", { exact: true }).fill("QA Günlük plan");
  await dialog.getByLabel("Tutar (TL)", { exact: true }).fill("50,25");
  await dialog
    .getByLabel("Kategori", { exact: true })
    .selectOption({ label: "Market" });
  await dialog
    .getByLabel("Tekrarlama sıklığı", { exact: true })
    .selectOption("daily");
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    (await demoData(page))?.transactions.filter(
      (t) => t.name === "QA Günlük plan",
    ),
  ).toHaveLength(0);
  const upcoming = page
    .locator(".upcoming-row")
    .filter({ hasText: "QA Günlük plan" })
    .first();
  await upcoming
    .getByRole("button", { name: "Gerçekleşti", exact: true })
    .dblclick();
  await expect
    .poll(
      async () =>
        (await demoData(page))?.transactions.filter(
          (t) => t.name === "QA Günlük plan",
        ).length,
    )
    .toBe(1);
  const rule = page.locator(".rule-row").filter({ hasText: "QA Günlük plan" });
  await rule.getByRole("button", { name: "QA Günlük plan sil" }).click();
  await page.getByRole("button", { name: "Evet, sil" }).click();
  await expect(rule).toHaveCount(0);
  expect(
    (await demoData(page))?.transactions.filter(
      (t) => t.name === "QA Günlük plan",
    ),
  ).toHaveLength(1);
});
test("empty onboarding, theme, JSON export and demo exit", async ({ page }) => {
  await page.addInitScript(
    (data) => localStorage.setItem("kasaflow-demo-v1", JSON.stringify(data)),
    emptyWorkspace(),
  );
  await ready(page);
  await expect(
    page.getByRole("heading", { name: "Finansal hikâyen burada başlıyor." }),
  ).toBeVisible();
  await expect(page.getByTestId("total-balance")).toContainText("0,00");
  await page.getByRole("button", { name: "İlk hesabımı oluştur" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await page.getByRole("button", { name: "Temayı değiştir" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await ready(page, "/demo/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tam veri yedeği (JSON)" }).click();
  expect((await download).suggestedFilename()).toBe("kasaflow-demo-yedek.json");
  await page.getByRole("button", { name: "Demodan çık", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
});

const viewports = [
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
for (const viewport of viewports)
  test(`responsive navigation and forms ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const warnings: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "warning" || m.type() === "error")
        warnings.push(m.text());
    });
    await ready(page);
    await expect(
      page.locator(".cashflow-panel .recharts-surface"),
    ).toBeVisible();
    await expect(
      page.locator(".distribution-panel .recharts-surface"),
    ).toBeVisible();
    await mkdir("artifacts/screenshots", { recursive: true });
    await page.screenshot({
      path: `artifacts/screenshots/overview-${viewport.width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    if (viewport.width <= 850) {
      await page.getByRole("button", { name: "Diğer sayfalar" }).click();
      await expect(
        page
          .getByRole("dialog")
          .getByRole("link", { name: "Raporlar", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: "Raporlar", exact: true })
        .click();
      await expect(page.locator("#main-content h1")).toHaveText("Raporlar");
    }
    for (const route of [
      "transactions",
      "accounts",
      "categories",
      "budgets",
      "recurring",
      "reports",
      "settings",
    ]) {
      await ready(page, `/demo/${route}`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `overflow at ${route}`,
      ).toBe(true);
    }
    await ready(page);
    await page.getByRole("button", { name: "Yeni işlem", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByLabel("İşlem adı", { exact: true }),
    ).toBeEditable();
    await dialog.getByLabel("İşlem adı", { exact: true }).fill("Mobil kontrol");
    await dialog.getByLabel("Tutar (TL)", { exact: true }).fill("100,50");
    await dialog
      .getByLabel("Kategori", { exact: true })
      .selectOption({ label: "Market" });
    await dialog
      .getByRole("button", { name: "Kaydet", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      dialog.getByRole("button", { name: "Kaydet", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: `artifacts/screenshots/form-${viewport.width}.png`,
      animations: "disabled",
    });
    await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(errors).toEqual([]);
    expect(
      warnings.filter((w) =>
        /width\(-1\)|height\(-1\)|hydration|unique.*key|controlled|uncontrolled/i.test(
          w,
        ),
      ),
    ).toEqual([]);
  });
test("WCAG accessibility checks in light and dark themes", async ({ page }) => {
  await ready(page);
  const output = [];
  for (const mode of ["light", "dark"]) {
    if (mode === "dark")
      await page.getByRole("button", { name: "Temayı değiştir" }).click();
    for (const route of [
      "overview",
      "transactions",
      "accounts",
      "categories",
      "budgets",
      "recurring",
      "reports",
      "settings",
    ]) {
      await ready(page, `/demo/${route}`);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      output.push({ mode, route, violations: result.violations });
    }
  }
  await mkdir("artifacts", { recursive: true });
  await writeFile(
    "artifacts/accessibility.json",
    JSON.stringify(output, null, 2),
  );
  await ready(page, "/demo");
  await page.screenshot({
    path: "artifacts/screenshots/overview-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    output.flatMap((r) =>
      r.violations.map((v) => ({
        mode: r.mode,
        route: r.route,
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    ),
  ).toEqual([]);
});
test("large financial values remain readable at 360px", async ({ page }) => {
  const data = emptyWorkspace();
  data.accounts = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Büyük bakiye",
      kind: "bank",
      opening_balance: 100000000000,
      currency: "TRY",
      color: "#648a54",
      description: "",
    },
  ];
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(
    (value) => localStorage.setItem("kasaflow-demo-v1", JSON.stringify(value)),
    data,
  );
  await ready(page);
  await expect(page.getByTestId("total-balance")).toContainText(
    "1.000.000.000,00",
  );
  expect(
    await page
      .getByTestId("total-balance")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
