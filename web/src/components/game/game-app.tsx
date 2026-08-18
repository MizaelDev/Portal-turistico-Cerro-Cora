"use client";

import { useCallback, useEffect, useState } from "react";
import { assertValidCards } from "@/lib/card-validation";
import { CARDS } from "@/data/cards";
import { clearGame, loadGame, loadTheme, saveGame, saveTheme } from "@/lib/storage/game-storage";
import { createGame } from "@/lib/game-engine";
import type { GameMode, GameSettings, SavedGame, Team, ThemeId } from "@/types/game";
import { PlayFlow } from "./play-flow";
import { SetupFlow } from "./setup-flow";

assertValidCards(CARDS);

export function GameApp() {
  const [game, setGameState] = useState<SavedGame | null>(null);
  const [saved, setSaved] = useState<SavedGame | null>(null);
  const [theme, setTheme] = useState<ThemeId>("arcade");
  const [homeKey, setHomeKey] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => { const loaded = loadGame(); const storedTheme = loadTheme(); setSaved(loaded); setTheme(storedTheme ?? loaded?.settings.theme ?? "arcade"); setReady(true); }, []);
  useEffect(() => { document.documentElement.dataset.gameTheme = theme; if (game?.settings.largeText) document.documentElement.dataset.largeText = "true"; else delete document.documentElement.dataset.largeText; }, [theme, game?.settings.largeText]);

  const setGame = useCallback((next: SavedGame) => { const error = saveGame(next); const value = error ? { ...next, notice: error } : next; setGameState(value); setSaved(value); }, []);
  const changeTheme = (next: ThemeId) => { setTheme(next); saveTheme(next); };
  const start = (mode: GameMode, teams: Team[], settings: GameSettings) => { const next = createGame(mode, teams, settings); changeTheme(settings.theme); setGame(next); };
  const home = (discard = false) => { setGameState(null); if (discard) { clearGame(); setSaved(null); } setHomeKey((value) => value + 1); };
  const newGame = () => home(true);

  if (!ready) return <main className="game-surface flex min-h-[100dvh] items-center justify-center"><div className="brand-lockup loading-brand"><span>NÃO</span><span>FALA!</span></div></main>;
  if (game) return <PlayFlow game={game} onChange={setGame} onHome={() => home(false)} onNewGame={newGame} />;
  return <SetupFlow key={homeKey} hasSaved={Boolean(saved)} initialTheme={theme} onTheme={changeTheme} onContinue={() => saved && setGameState(saved)} onDiscard={() => home(true)} onStart={start} />;
}
