import { expect, test } from "@playwright/test";

test("lightbox contém o foco, responde ao teclado e devolve o foco ao acionador", async ({ page }) => {
  await page.goto("/pousadas/plato-da-nascente");

  const refuseAnalytics = page.getByRole("button", { name: "Recusar medições" });
  if (await refuseAnalytics.isVisible()) await refuseAnalytics.click();

  const trigger = page.getByRole("button", { name: "Abrir foto em tela cheia" });
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
