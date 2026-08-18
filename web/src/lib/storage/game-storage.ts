import type { SavedGame, ThemeId } from "@/types/game";

const GAME_KEY = "nao-fala:game:v1";
const THEME_KEY = "nao-fala:theme";

export function saveGame(game: SavedGame): string | null {
  try { localStorage.setItem(GAME_KEY, JSON.stringify(game)); return null; }
  catch { return "Não foi possível salvar. A partida continua nesta tela."; }
}
export function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    return parsed.version === 1 ? parsed : null;
  } catch { return null; }
}
export function clearGame(): void { try { localStorage.removeItem(GAME_KEY); } catch {} }
export function saveTheme(theme: ThemeId): void { try { localStorage.setItem(THEME_KEY, theme); } catch {} }
export function loadTheme(): ThemeId | null { try { return localStorage.getItem(THEME_KEY) as ThemeId | null; } catch { return null; } }
