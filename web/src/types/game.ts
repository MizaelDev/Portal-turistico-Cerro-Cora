export const CATEGORIES = [
  "Objetos", "Animais", "Comidas", "Lugares", "Profissões", "Tecnologia",
  "Internet", "Brasil", "Nordeste", "Futebol", "Esportes", "Escola",
  "Casa", "Transporte", "Natureza", "Aleatórias",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "classic" | "lightning" | "chaos";
export type ThemeId = "arcade" | "junina" | "space" | "football" | "spooky" | "minimal";
export type GameScreen = "home" | "howTo" | "modeSelection" | "setup" | "ready" | "countdown" | "playing" | "paused" | "roundSummary" | "scoreboard" | "tieBreaker" | "finished";
export type ActionKind = "correct" | "skip" | "forbidden";

export interface GameCard {
  id: string;
  word: string;
  forbidden: [string, string, string, string, string];
  category: Category;
  difficulty: Difficulty;
  tags?: string[];
}

export interface Team {
  id: string;
  name: string;
  color: string;
  avatar: string;
  players: string[];
  score: number;
  totals: RoundStats;
}

export interface GameSettings {
  rounds: number;
  seconds: number;
  categories: Category[];
  difficulty: Difficulty | "mixed";
  skipLimit: number | null;
  skipPenalty: boolean;
  sound: boolean;
  vibration: boolean;
  gestures: boolean;
  theme: ThemeId;
  confirmAbandon: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  chaosRules: boolean;
}

export interface RoundStats {
  correct: number;
  skipped: number;
  forbidden: number;
  cards: number;
  bestStreak: number;
  points: number;
}

export interface GameAction {
  kind: ActionKind;
  cardId: string;
  delta: number;
  at: number;
}

export interface SavedGame {
  version: 1;
  screen: GameScreen;
  mode: GameMode;
  settings: GameSettings;
  teams: Team[];
  turnIndex: number;
  playerIndexes: Record<string, number>;
  usedCardIds: string[];
  currentCardId: string | null;
  actionHistory: GameAction[];
  roundStats: RoundStats;
  endAt: number | null;
  remainingMs: number;
  chaosRule: string | null;
  countdown: number;
  tieTeamIds: string[];
  tieRound: number;
  tieScores: Record<string, number>;
  seed: number;
  notice?: string;
}

export const EMPTY_STATS: RoundStats = { correct: 0, skipped: 0, forbidden: 0, cards: 0, bestStreak: 0, points: 0 };

export const DEFAULT_SETTINGS: GameSettings = {
  rounds: 3,
  seconds: 60,
  categories: [...CATEGORIES],
  difficulty: "mixed",
  skipLimit: null,
  skipPenalty: false,
  sound: true,
  vibration: true,
  gestures: true,
  theme: "arcade",
  confirmAbandon: true,
  reducedMotion: false,
  largeText: false,
  chaosRules: true,
};
