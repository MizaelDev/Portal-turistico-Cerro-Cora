import { CARDS } from "@/data/cards";
import { DEFAULT_SETTINGS, EMPTY_STATS, type ActionKind, type GameCard, type GameMode, type GameSettings, type SavedGame, type Team } from "@/types/game";

export const CHAOS_RULES = [
  "Não pode gesticular.", "Fale como narrador de futebol.", "Explique usando frases curtas.",
  "Não pode dizer ‘é’.", "Não pode dizer ‘tem’.", "Carta valendo dois pontos.",
  "Apenas um pulo disponível.", "Dez segundos a menos.", "Dez segundos a mais.",
  "Rodada sem penalidade.", "Não pode apontar para objetos.", "Explique falando devagar.",
];

export const TEAM_NAMES = ["Os Sem Filtro", "Boca Fechada", "Quase Acertou", "Os Enrolados", "Não Vale Gritar", "Fala Baixo", "Palavra Final", "Os Desesperados", "Só Mais Uma", "Ninguém Sabe"];
export const TEAM_COLORS = ["#ef5b35", "#17a398", "#ffca3a", "#6c63ff", "#e8488a", "#3a86ff"];
export const TEAM_AVATARS = ["zap", "flame", "star", "ghost", "crown", "rocket"];

export const makeTeam = (index: number): Team => ({
  id: crypto.randomUUID?.() ?? `team-${Date.now()}-${index}`,
  name: TEAM_NAMES[index] ?? `Equipe ${index + 1}`,
  color: TEAM_COLORS[index % TEAM_COLORS.length],
  avatar: TEAM_AVATARS[index % TEAM_AVATARS.length],
  players: [], score: 0, totals: { ...EMPTY_STATS },
});

export function shuffled<T>(items: T[], seed = Date.now()): T[] {
  const result = [...items]; let value = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const j = value % (i + 1); [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function filteredCards(settings: GameSettings, usedIds: string[] = []): GameCard[] {
  const used = new Set(usedIds);
  return CARDS.filter((card) => !used.has(card.id) && settings.categories.includes(card.category) && (settings.difficulty === "mixed" || card.difficulty === settings.difficulty));
}

export function drawCard(game: SavedGame): GameCard | null {
  const cards = shuffled(filteredCards(game.settings, game.usedCardIds), game.seed + game.usedCardIds.length * 31);
  return cards[0] ?? null;
}

function effectiveDelta(game: SavedGame, kind: ActionKind): number {
  if (kind === "correct") return game.chaosRule === "Carta valendo dois pontos." ? 2 : 1;
  if (kind === "forbidden") return game.chaosRule === "Rodada sem penalidade." ? 0 : -1;
  if (kind === "skip") return game.settings.skipPenalty && game.chaosRule !== "Rodada sem penalidade." ? -1 : 0;
  return 0;
}

export function currentTeamIndex(game: SavedGame): number {
  if (game.tieTeamIds.length) {
    const id = game.tieTeamIds[game.turnIndex % game.tieTeamIds.length];
    return Math.max(0, game.teams.findIndex((team) => team.id === id));
  }
  return game.turnIndex % game.teams.length;
}
export const currentRound = (game: SavedGame): number => game.tieTeamIds.length ? game.tieRound : Math.floor(game.turnIndex / game.teams.length) + 1;
export const currentTeam = (game: SavedGame): Team => game.teams[currentTeamIndex(game)];

export function effectiveSkipLimit(game: SavedGame): number | null {
  if (game.chaosRule === "Apenas um pulo disponível.") return 1;
  return game.mode === "lightning" ? 2 : game.settings.skipLimit;
}

export function applyAction(game: SavedGame, kind: ActionKind, now = Date.now()): SavedGame {
  if (game.screen !== "playing" || !game.currentCardId || (game.endAt !== null && now >= game.endAt)) return game;
  const limit = effectiveSkipLimit(game);
  if (kind === "skip" && limit !== null && game.roundStats.skipped >= limit) return { ...game, notice: "Você já usou todos os pulos desta rodada." };
  const delta = effectiveDelta(game, kind);
  const action = { kind, cardId: game.currentCardId, delta, at: now };
  const streak = kind === "correct" ? trailingCorrect(game.actionHistory) + 1 : 0;
  const stats = {
    ...game.roundStats,
    correct: game.roundStats.correct + (kind === "correct" ? 1 : 0),
    skipped: game.roundStats.skipped + (kind === "skip" ? 1 : 0),
    forbidden: game.roundStats.forbidden + (kind === "forbidden" ? 1 : 0),
    cards: game.roundStats.cards + 1,
    points: game.roundStats.points + delta,
    bestStreak: Math.max(game.roundStats.bestStreak, streak),
  };
  const usedCardIds = [...game.usedCardIds, game.currentCardId];
  const nextBase = { ...game, usedCardIds, actionHistory: [...game.actionHistory, action], roundStats: stats, seed: game.seed + 1, notice: undefined };
  const next = drawCard(nextBase);
  return { ...nextBase, currentCardId: next?.id ?? null, notice: next ? undefined : "O baralho filtrado acabou. Adicione mais categorias na próxima partida." };
}

function trailingCorrect(actions: SavedGame["actionHistory"]): number {
  let total = 0;
  for (let i = actions.length - 1; i >= 0 && actions[i].kind === "correct"; i--) total++;
  return total;
}

export function undoAction(game: SavedGame): SavedGame {
  const action = game.actionHistory.at(-1);
  if (!action) return game;
  const stats = { ...game.roundStats, cards: Math.max(0, game.roundStats.cards - 1), points: game.roundStats.points - action.delta };
  if (action.kind === "correct") stats.correct--;
  if (action.kind === "skip") stats.skipped--;
  if (action.kind === "forbidden") stats.forbidden--;
  return { ...game, currentCardId: action.cardId, usedCardIds: game.usedCardIds.filter((id) => id !== action.cardId), actionHistory: game.actionHistory.slice(0, -1), roundStats: stats, notice: "Última ação desfeita." };
}

export function createGame(mode: GameMode, teams: Team[], incoming: GameSettings): SavedGame {
  const settings = { ...DEFAULT_SETTINGS, ...incoming, seconds: mode === "lightning" ? 30 : incoming.seconds, skipLimit: mode === "lightning" ? 2 : incoming.skipLimit };
  const seed = Date.now();
  const base: SavedGame = { version: 1, screen: "ready", mode, settings, teams: teams.map((team) => ({ ...team, score: 0, totals: { ...EMPTY_STATS } })), turnIndex: 0, playerIndexes: {}, usedCardIds: [], currentCardId: null, actionHistory: [], roundStats: { ...EMPTY_STATS }, endAt: null, remainingMs: settings.seconds * 1000, chaosRule: null, countdown: 3, tieTeamIds: [], tieRound: 0, tieScores: {}, seed };
  return prepareTurn(base);
}

export function prepareTurn(game: SavedGame): SavedGame {
  const chaosRule = game.mode === "chaos" && game.settings.chaosRules ? CHAOS_RULES[(game.seed + game.turnIndex) % CHAOS_RULES.length] : null;
  let seconds = game.tieTeamIds.length || game.mode === "lightning" ? 30 : game.settings.seconds;
  if (chaosRule === "Dez segundos a menos.") seconds = Math.max(20, seconds - 10);
  if (chaosRule === "Dez segundos a mais.") seconds += 10;
  const reset = { ...game, screen: game.tieTeamIds.length ? "tieBreaker" as const : "ready" as const, currentCardId: null, actionHistory: [], roundStats: { ...EMPTY_STATS }, endAt: null, remainingMs: seconds * 1000, countdown: 3, chaosRule, notice: undefined };
  const card = drawCard(reset);
  return { ...reset, currentCardId: card?.id ?? null };
}

export function startTurn(game: SavedGame, now = Date.now()): SavedGame { return { ...game, screen: "playing", endAt: now + game.remainingMs }; }
export function pauseTurn(game: SavedGame, now = Date.now()): SavedGame { return game.screen === "playing" ? { ...game, screen: "paused", remainingMs: Math.max(0, (game.endAt ?? now) - now), endAt: null } : game; }
export function resumeTurn(game: SavedGame, now = Date.now()): SavedGame { return game.screen === "paused" ? { ...game, screen: "playing", endAt: now + game.remainingMs } : game; }
export function finishTurn(game: SavedGame): SavedGame { return game.screen === "playing" ? { ...game, screen: "roundSummary", remainingMs: 0, endAt: null } : game; }

export function commitTurn(game: SavedGame): SavedGame {
  const index = currentTeamIndex(game); const team = game.teams[index];
  const teams = game.teams.map((item, i) => i === index ? { ...item, score: item.score + game.roundStats.points, totals: { correct: item.totals.correct + game.roundStats.correct, skipped: item.totals.skipped + game.roundStats.skipped, forbidden: item.totals.forbidden + game.roundStats.forbidden, cards: item.totals.cards + game.roundStats.cards, bestStreak: Math.max(item.totals.bestStreak, game.roundStats.bestStreak), points: item.totals.points + game.roundStats.points } } : item);
  const playerIndexes = { ...game.playerIndexes, [team.id]: ((game.playerIndexes[team.id] ?? 0) + 1) % Math.max(1, team.players.length) };
  if (game.tieTeamIds.length) {
    const tieScores = { ...game.tieScores, [team.id]: (game.tieScores[team.id] ?? 0) + game.roundStats.points };
    const nextTurn = game.turnIndex + 1;
    if (nextTurn % game.tieTeamIds.length === 0) {
      const best = Math.max(...game.tieTeamIds.map((id) => tieScores[id] ?? 0));
      const leaders = game.tieTeamIds.filter((id) => (tieScores[id] ?? 0) === best);
      if (leaders.length === 1) return { ...game, teams, playerIndexes, tieScores, tieTeamIds: leaders, screen: "finished" };
      return prepareTurn({ ...game, teams, playerIndexes, tieScores: {}, tieTeamIds: leaders, tieRound: game.tieRound + 1, turnIndex: 0, screen: "tieBreaker" });
    }
    return { ...game, teams, playerIndexes, tieScores, turnIndex: nextTurn, screen: "scoreboard" };
  }
  const nextTurn = game.turnIndex + 1;
  const allTurns = game.settings.rounds * teams.length;
  if (nextTurn >= allTurns) {
    const best = Math.max(...teams.map((item) => item.score));
    const tied = teams.filter((item) => item.score === best).map((item) => item.id);
    return tied.length > 1 ? prepareTurn({ ...game, teams, playerIndexes, tieTeamIds: tied, tieRound: 1, tieScores: {}, turnIndex: 0, screen: "tieBreaker" }) : { ...game, teams, playerIndexes, tieTeamIds: tied, screen: "finished" };
  }
  return { ...game, teams, playerIndexes, turnIndex: nextTurn, screen: "scoreboard" };
}

export function nextFromScoreboard(game: SavedGame): SavedGame { return prepareTurn(game); }
export function replay(game: SavedGame): SavedGame { return createGame(game.mode, game.teams, game.settings); }
