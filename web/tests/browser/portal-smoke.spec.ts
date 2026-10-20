import { expect, test } from "@playwright/test";

test("analytics começa desligado e páginas públicas essenciais respondem", async ({ page }) => {
  const response = await page.goto("/");

  expect(response).not.toBeNull();
  expect(response!.headers()["x-powered-by"]).toBeUndefined();
  expect(response!.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");

  await expect(page.getByRole("button", { name: "Recusar medições" })).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
  await expect(page.locator('script[src*="_vercel/insights"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Recusar medições" }).click();
  await page.goto("/politica-de-privacidade");
  await expect(page.getByRole("heading", { name: "Política de privacidade", level: 1 })).toBeVisible();

  for (const route of ["/gastronomia", "/pousadas", "/servicos"]) {
    const directoryResponse = await page.goto(route);
    expect(directoryResponse?.status(), `${route} deve responder sem erro`).toBeLessThan(400);
  }

  const noHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(noHorizontalOverflow).toBe(true);
});

test("área administrativa sem sessão redireciona para o login", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Painel administrativo", level: 2 })).toBeVisible();
});
