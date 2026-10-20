import { expect, test } from "@playwright/test";

test("lightbox contém o foco, responde ao teclado e devolve o foco ao acionador", async ({ page }) => {
  const detailPages = [
    "/pousadas/plato-da-nascente",
    "/pousadas/pousada-e-restaurante-serido",
  ];
  let trigger = page.getByRole("button", { name: "Abrir foto em tela cheia" });

  for (const detailPage of detailPages) {
    await page.goto(detailPage);

    const refuseAnalytics = page.getByRole("button", { name: "Recusar medições" });
    if (await refuseAnalytics.isVisible()) await refuseAnalytics.click();

    trigger = page.getByRole("button", { name: "Abrir foto em tela cheia" });
    if (await trigger.count()) break;
  }

  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: /Galeria de fotos/ });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Fechar galeria" })).toBeFocused();

  await page.keyboard.press("Tab");
  const focusInsideDialog = await page.evaluate(() =>
    Boolean(document.activeElement?.closest('[role="dialog"]')),
  );
  expect(focusInsideDialog).toBe(true);

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
