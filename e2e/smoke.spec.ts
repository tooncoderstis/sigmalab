import { expect, test } from "@playwright/test";

test("health endpoint mengembalikan status ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  await expect(res.json()).resolves.toMatchObject({ status: "ok" });
});

test("landing page dapat dimuat", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/sigmalab/i);
});

test("area terlindungi mengarahkan anonim ke login", async ({ page }) => {
  await page.goto("/admin/akademik");
  expect(page.url()).toContain("/login");

  await page.goto("/guru");
  expect(page.url()).toContain("/login");
});

