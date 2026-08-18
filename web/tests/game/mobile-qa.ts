import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const consoleErrors: string[] = [];
const baseURL = process.env.QA_BASE_URL ?? "http://localhost:3000";
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

await page.goto(baseURL, { waitUntil: "networkidle" });
assert.equal(await page.getByRole("button", { name: "Jogar agora" }).isVisible(), true);
await page.getByRole("button", { name: "Jogar agora" }).click();
await page.getByRole("button", { name: /Clássico/ }).click();
const playerInput = page.getByLabel("Jogadores opcionais, separados por vírgula").first();
await playerInput.fill("João, Maria Silva, Ana");
assert.equal(await playerInput.inputValue(), "João, Maria Silva, Ana");
await page.getByRole("button", { name: "Configurar partida" }).click();
await page.getByRole("button", { name: "Começar partida" }).click();
assert.equal(await page.getByText("Passe o celular para quem vai explicar.").isVisible(), true);
assert.equal(await page.locator(".game-card").count(), 0, "A carta não pode aparecer antes da confirmação");
await page.getByRole("button", { name: "Estou pronto" }).click();
await page.waitForSelector(".game-card", { state: "visible", timeout: 6_000 });
const saved = await page.evaluate(() => localStorage.getItem("nao-fala:game:v1"));
assert.ok(saved, "A partida deve ser persistida");
assert.equal(JSON.parse(saved!).version, 1);
assert.deepEqual(JSON.parse(saved!).teams[0].players, ["João", "Maria Silva", "Ana"]);
const actions = await page.locator(".action-dock").boundingBox();
assert.ok(actions && actions.y + actions.height <= 844, "Os controles precisam caber na viewport mobile");
await page.screenshot({ path: "mobile-playing.png", fullPage: false });
await page.reload({ waitUntil: "networkidle" });
assert.equal(await page.getByRole("button", { name: "Continuar partida" }).isVisible(), true);
await page.getByRole("button", { name: "Continuar partida" }).click();
assert.equal(await page.locator(".game-card").isVisible(), true);
assert.deepEqual(consoleErrors, []);
await browser.close();
console.log("QA mobile aprovado: fluxo, carta oculta, controles, persistência e console.");
