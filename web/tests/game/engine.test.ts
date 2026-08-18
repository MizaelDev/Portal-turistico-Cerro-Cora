import assert from "node:assert/strict";
import test from "node:test";
import { CARDS } from "../../src/data/cards.ts";
import { validateCards } from "../../src/lib/card-validation/index.ts";
import { applyAction, commitTurn, createGame, filteredCards, finishTurn, pauseTurn, prepareTurn, resumeTurn, startTurn, undoAction } from "../../src/lib/game-engine/index.ts";
import { CATEGORIES, DEFAULT_SETTINGS, EMPTY_STATS, type Team } from "../../src/types/game.ts";

const teams: Team[] = [
  { id: "a", name: "Boca Fechada", color: "#f00", avatar: "zap", players: [], score: 0, totals: { ...EMPTY_STATS } },
  { id: "b", name: "Os Enrolados", color: "#0f0", avatar: "star", players: [], score: 0, totals: { ...EMPTY_STATS } },
];

test("baralho tem 160 cartas válidas e a distribuição exigida", () => {
  assert.equal(CARDS.length, 160);
  assert.deepEqual(validateCards(CARDS), []);
  assert.equal(CARDS.filter((card) => card.difficulty === "easy").length, 48);
  assert.equal(CARDS.filter((card) => card.difficulty === "medium").length, 72);
  assert.equal(CARDS.filter((card) => card.difficulty === "hard").length, 40);
  assert.deepEqual(new Set(CARDS.map((card) => card.category)), new Set(CATEGORIES));
});

test("filtros de categoria e dificuldade respeitam cartas usadas", () => {
  const settings = { ...DEFAULT_SETTINGS, categories: ["Animais" as const], difficulty: "easy" as const };
  const initial = filteredCards(settings);
  assert.ok(initial.length > 0);
  assert.ok(initial.every((card) => card.category === "Animais" && card.difficulty === "easy"));
  assert.equal(filteredCards(settings, [initial[0].id]).some((card) => card.id === initial[0].id), false);
});

test("pontuação, penalidade e desfazer restauram a carta", () => {
  let game = startTurn(createGame("classic", teams, DEFAULT_SETTINGS), 1_000);
  const first = game.currentCardId;
  game = applyAction(game, "correct", 1_100);
  assert.equal(game.roundStats.points, 1);
  assert.equal(game.roundStats.correct, 1);
  assert.notEqual(game.currentCardId, first);
  game = applyAction(game, "forbidden", 1_200);
  assert.equal(game.roundStats.points, 0);
  const penalized = game.actionHistory.at(-1)?.cardId;
  game = undoAction(game);
  assert.equal(game.roundStats.points, 1);
  assert.equal(game.roundStats.forbidden, 0);
  assert.equal(game.currentCardId, penalized);
});

test("Relâmpago bloqueia o terceiro pulo", () => {
  let game = startTurn(createGame("lightning", teams, DEFAULT_SETTINGS), 1_000);
  game = applyAction(game, "skip", 1_100);
  game = applyAction(game, "skip", 1_200);
  const history = game.actionHistory.length;
  game = applyAction(game, "skip", 1_300);
  assert.equal(game.actionHistory.length, history);
  assert.match(game.notice ?? "", /todos os pulos/);
});

test("troca equipes, avança rodadas e finaliza", () => {
  let game = createGame("classic", teams, { ...DEFAULT_SETTINGS, rounds: 2 });
  game = commitTurn({ ...game, screen: "roundSummary", roundStats: { ...EMPTY_STATS, correct: 1, cards: 1, points: 1 } });
  assert.equal(game.turnIndex, 1);
  assert.equal(game.screen, "scoreboard");
  game = prepareTurn(game);
  game = commitTurn({ ...game, screen: "roundSummary" });
  assert.equal(game.turnIndex, 2);
  game = prepareTurn(game);
  game = commitTurn({ ...game, screen: "roundSummary" });
  game = prepareTurn(game);
  game = commitTurn({ ...game, screen: "roundSummary" });
  assert.equal(game.screen, "finished");
  assert.equal(game.teams[0].score, 1);
});

test("empate abre desempate de 30 segundos", () => {
  let game = createGame("classic", teams, { ...DEFAULT_SETTINGS, rounds: 2 });
  for (let i = 0; i < 4; i++) {
    game = commitTurn({ ...game, screen: "roundSummary" });
    if (game.screen === "scoreboard") game = prepareTurn(game);
  }
  assert.equal(game.screen, "tieBreaker");
  assert.equal(game.tieTeamIds.length, 2);
  assert.equal(game.remainingMs, 30_000);
});

test("cronômetro usa timestamp, pausa, retoma e bloqueia após fim", () => {
  let game = startTurn(createGame("classic", teams, { ...DEFAULT_SETTINGS, seconds: 60 }), 10_000);
  assert.equal(game.endAt, 70_000);
  game = pauseTurn(game, 20_000);
  assert.equal(game.remainingMs, 50_000);
  game = resumeTurn(game, 30_000);
  assert.equal(game.endAt, 80_000);
  const unchanged = applyAction(game, "correct", 80_001);
  assert.equal(unchanged.actionHistory.length, 0);
  game = finishTurn(game);
  assert.equal(game.screen, "roundSummary");
});
