"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Ban, Check, Clock3, Crown, FastForward, Flag, Home, Medal, Pause, Play, RefreshCcw, RotateCcw, Settings2, SkipForward, Trophy, Undo2, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CARDS } from "@/data/cards";
import { playCue, vibrate } from "@/lib/audio/game-audio";
import { applyAction, commitTurn, currentRound, currentTeam, effectiveSkipLimit, finishTurn, nextFromScoreboard, pauseTurn, prepareTurn, replay, resumeTurn, startTurn, undoAction } from "@/lib/game-engine";
import type { ActionKind, SavedGame } from "@/types/game";
import { TeamAvatar } from "./team-avatar";

export function PlayFlow({ game, onChange, onHome, onNewGame }: { game: SavedGame; onChange: (game: SavedGame) => void; onHome: () => void; onNewGame: () => void }) {
  const [now, setNow] = useState(Date.now());
  const [count, setCount] = useState(3);
  const endedRef = useRef(false);
  const team = currentTeam(game);
  const round = currentRound(game);
  const player = team.players[game.playerIndexes[team.id] ?? 0];
  const card = CARDS.find((item) => item.id === game.currentCardId) ?? null;
  const totalSeconds = Math.max(1, game.tieTeamIds.length || game.mode === "lightning" ? 30 : game.settings.seconds + (game.chaosRule === "Dez segundos a mais." ? 10 : game.chaosRule === "Dez segundos a menos." ? -10 : 0));
  const remaining = game.screen === "playing" ? Math.max(0, (game.endAt ?? now) - now) : game.remainingMs;
  const seconds = Math.ceil(remaining / 1000);
  const progress = Math.max(0, Math.min(1, remaining / (totalSeconds * 1000)));

  useEffect(() => {
    if (game.screen !== "playing") return;
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [game.screen]);

  useEffect(() => {
    if (game.screen !== "playing") { endedRef.current = false; return; }
    if (seconds === 10) vibrate(80, game.settings.vibration);
    if (seconds <= 5 && seconds > 0) playCue("tick", game.settings.sound);
    if (remaining <= 0 && !endedRef.current) {
      endedRef.current = true; playCue("finish", game.settings.sound); vibrate([180, 80, 260], game.settings.vibration); onChange(finishTurn(game));
    }
  }, [seconds, remaining, game, onChange]);

  const action = useCallback((kind: ActionKind) => {
    const next = applyAction(game, kind);
    if (next === game) return;
    playCue(kind, game.settings.sound); vibrate(kind === "forbidden" ? [70, 40, 70] : 35, game.settings.vibration); onChange(next);
  }, [game, onChange]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") action("correct");
      if (event.key === "ArrowUp") action("skip");
      if (event.key === "ArrowLeft") action("forbidden");
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); onChange(undoAction(game)); }
      if (event.code === "Space") { event.preventDefault(); if (game.screen === "playing") onChange(pauseTurn(game)); else if (game.screen === "paused") onChange(resumeTurn(game)); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, [action, game, onChange]);

  const beginCountdown = () => { setCount(3); onChange({ ...game, screen: "countdown" }); };
  useEffect(() => {
    if (game.screen !== "countdown") return;
    if (count <= 0) { playCue("start", game.settings.sound); onChange(startTurn(game)); return; }
    playCue("tick", game.settings.sound);
    const timeout = window.setTimeout(() => setCount((value) => value - 1), 700); return () => window.clearTimeout(timeout);
  }, [count, game, onChange]);

  if (game.screen === "countdown") return <FullCenter><motion.div key={count} initial={{ scale: .4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="countdown-number">{count || "VALENDO!"}</motion.div></FullCenter>;
  if (game.screen === "ready" || game.screen === "tieBreaker") return <Ready game={game} teamName={team.name} player={player} round={round} onReady={beginCountdown} onHome={onHome} />;
  if (game.screen === "playing") return <Playing game={game} card={card} teamName={team.name} player={player} round={round} seconds={seconds} progress={progress} onAction={action} onPause={() => onChange(pauseTurn(game))} onSound={() => onChange({ ...game, settings: { ...game.settings, sound: !game.settings.sound } })} onUndo={() => onChange(undoAction(game))} />;
  if (game.screen === "paused") return <PauseScreen game={game} onResume={() => onChange(resumeTurn(game))} onRestart={() => { if (!game.settings.confirmAbandon || confirm("Reiniciar esta rodada? Os pontos da vez serão apagados.")) onChange(prepareTurn(game)); }} onHome={() => { if (!game.settings.confirmAbandon || confirm("Abandonar a partida e voltar ao início?")) onHome(); }} />;
  if (game.screen === "roundSummary") return <RoundSummary game={game} onUndo={() => onChange(undoAction(game))} onConfirm={() => onChange(commitTurn(game))} />;
  if (game.screen === "scoreboard") return <Scoreboard game={game} onNext={() => onChange(nextFromScoreboard(game))} />;
  return <Finished game={game} onReplay={() => onChange(replay(game))} onNewGame={onNewGame} onHome={onHome} />;
}

function Ready({ game, teamName, player, round, onReady, onHome }: { game: SavedGame; teamName: string; player?: string; round: number; onReady: () => void; onHome: () => void }) {
  const team = currentTeam(game);
  return <FullCenter><div className="ready-panel"><button className="icon-button absolute left-4 top-4" aria-label="Voltar ao início" onClick={onHome}><ArrowLeft /></button>{game.tieTeamIds.length ? <span className="mode-tag">Desempate {round}</span> : <span className="step-label">Rodada {round} de {game.settings.rounds}</span>}<TeamAvatar avatar={team.avatar} color={team.color} className="mx-auto mt-6 h-16 w-16" /><h1 className="mt-4 font-display text-4xl font-black" style={{ color: team.color }}>{teamName}</h1>{player ? <p className="mt-1 font-bold text-[var(--muted)]">Agora é a vez de {player}</p> : null}<p className="mx-auto mt-6 max-w-sm text-lg font-bold">Passe o celular para quem vai explicar.</p><div className="my-6 flex justify-center gap-4 text-sm font-extrabold"><span>{team.score} pontos</span><span>{game.mode === "lightning" ? "30 segundos" : `${Math.round(game.remainingMs / 1000)} segundos`}</span></div>{game.chaosRule ? <div className="chaos-rule"><Flag /> <div><b>Regra surpresa</b><p>{game.chaosRule}</p></div></div> : null}<button className="primary-button mt-7" onClick={onReady}><Play />Estou pronto</button></div></FullCenter>;
}

function Playing({ game, card, teamName, player, round, seconds, progress, onAction, onPause, onSound, onUndo }: { game: SavedGame; card: (typeof CARDS)[number] | null; teamName: string; player?: string; round: number; seconds: number; progress: number; onAction: (kind: ActionKind) => void; onPause: () => void; onSound: () => void; onUndo: () => void }) {
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const skipLimit = effectiveSkipLimit(game);
  const swipeEnd = (x: number, y: number) => { if (!game.settings.gestures || !pointer.current) return; const dx = x - pointer.current.x; const dy = y - pointer.current.y; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) onAction(dx > 0 ? "correct" : "forbidden"); else if (dy < -70) onAction("skip"); pointer.current = null; };
  return <main className="play-screen" onPointerDown={(event) => { pointer.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={(event) => swipeEnd(event.clientX, event.clientY)}>
    <header className="play-header"><div className="flex min-w-0 items-center gap-2"><TeamAvatar avatar={currentTeam(game).avatar} color={currentTeam(game).color} /><div className="min-w-0"><b className="block truncate">{teamName}</b><span>{player || `Rodada ${round}`}</span></div></div><div className="play-score"><b>{currentTeam(game).score + game.roundStats.points}</b><span>pontos</span></div><button className="icon-button" aria-label={game.settings.sound ? "Desativar som" : "Ativar som"} onClick={onSound}>{game.settings.sound ? <Volume2 /> : <VolumeX />}</button><button className="icon-button" aria-label="Pausar" onClick={onPause}><Pause /></button></header>
    <div className={`timer ${seconds <= 10 ? "timer-warning" : ""} ${seconds <= 5 ? "timer-danger" : ""}`}><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" /><motion.circle cx="50" cy="50" r="44" pathLength="1" strokeDasharray="1" animate={{ strokeDashoffset: 1 - progress }} /></svg><strong>{seconds}</strong></div>
    <AnimatePresence mode="wait">{card ? <motion.article key={card.id} className="game-card" initial={{ opacity: 0, rotate: 1.5, scale: .97 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: game.settings.reducedMotion ? 0 : .16 }}><div className="card-meta"><span>{card.category}</span><span>{card.difficulty === "easy" ? "Fácil" : card.difficulty === "medium" ? "Média" : "Difícil"}</span></div><h1>{card.word}</h1><p className="dont-say">Não fale</p><div className="forbidden-list">{card.forbidden.map((word) => <span key={word}><Ban />{word}</span>)}</div></motion.article> : <div className="game-card empty-card"><h1>Sem cartas</h1><p>O filtro atual esgotou o baralho.</p></div>}</AnimatePresence>
    <p aria-live="polite" className="game-notice">{game.notice || (skipLimit !== null ? `${Math.max(0, skipLimit - game.roundStats.skipped)} pulos restantes` : "Gestos e botões estão ativos")}</p>
    <div className="action-dock"><button className="action-button penalty" onClick={() => onAction("forbidden")}><Ban /><span>NÃO FALOU</span></button><button className="action-button skip" disabled={skipLimit !== null && game.roundStats.skipped >= skipLimit} onClick={() => onAction("skip")}><SkipForward /><span>PULOU</span></button><button className="action-button correct" onClick={() => onAction("correct")}><Check /><span>ACERTOU</span></button><button className="undo-button" disabled={!game.actionHistory.length} onClick={onUndo}><Undo2 />Desfazer</button></div>
  </main>;
}

function PauseScreen({ game, onResume, onRestart, onHome }: { game: SavedGame; onResume: () => void; onRestart: () => void; onHome: () => void }) { return <FullCenter><div className="ready-panel"><Pause className="mx-auto h-12 w-12 text-[var(--accent)]" /><h1 className="mt-4 font-display text-4xl font-black">Rodada pausada</h1><p className="mt-3 text-[var(--muted)]">A carta está escondida e o tempo congelado em {Math.ceil(game.remainingMs / 1000)}s.</p><div className="mt-7 grid gap-3"><button className="primary-button" onClick={onResume}><Play />Continuar</button><button className="secondary-button" onClick={onRestart}><RotateCcw />Reiniciar rodada</button><button className="ghost-button danger" onClick={onHome}><X />Abandonar partida</button></div></div></FullCenter>; }

function RoundSummary({ game, onUndo, onConfirm }: { game: SavedGame; onUndo: () => void; onConfirm: () => void }) { const stats = game.roundStats; return <FullCenter><div className="summary-panel"><div className="summary-burst"><Clock3 /></div><p className="step-label">Tempo esgotado</p><h1 className="font-display text-4xl font-black">Boa rodada, {currentTeam(game).name}!</h1><div className="stat-grid"><Stat value={stats.points} label="Pontos" /><Stat value={stats.correct} label="Acertos" /><Stat value={stats.skipped} label="Pulos" /><Stat value={stats.forbidden} label="Proibidas" /><Stat value={stats.cards} label="Cartas" /><Stat value={stats.bestStreak} label="Melhor sequência" /></div><p className="mt-5 text-center font-bold">Total após confirmar: {currentTeam(game).score + stats.points} pontos</p><div className="mt-6 grid gap-3"><button className="primary-button" onClick={onConfirm}><Check />Confirmar rodada</button><button className="ghost-button" disabled={!game.actionHistory.length} onClick={onUndo}><Undo2 />Corrigir última ação</button></div></div></FullCenter>; }

function Scoreboard({ game, onNext }: { game: SavedGame; onNext: () => void }) { const sorted = [...game.teams].sort((a,b) => b.score - a.score); const lead = sorted[0]?.score ?? 0; const messages = ["A disputa apertou.", "Ainda dá para virar.", "Essa rodada mudou o jogo.", "Tudo pode acontecer agora.", "A próxima rodada pode decidir."]; return <main className="game-surface min-h-[100dvh] px-4 py-8"><div className="mx-auto max-w-xl"><p className="step-label">Placar atual</p><h1 className="font-display text-4xl font-black">{messages[(game.turnIndex + game.seed) % messages.length]}</h1><div className="score-list mt-7">{sorted.map((team, index) => <motion.div layout key={team.id} className="score-row"><b className="rank">{index + 1}</b><TeamAvatar avatar={team.avatar} color={team.color} className="h-8 w-8" /><div className="min-w-0 flex-1"><b className="block truncate">{team.name}</b><span>{index === 0 ? "Na liderança" : `${lead - team.score} atrás`}</span></div><strong>{team.score}</strong></motion.div>)}</div><div className="next-team"><FastForward /><span>Próxima equipe</span><b>{currentTeam(nextFromScoreboard(game)).name}</b></div><button className="primary-button mt-6" onClick={onNext}>Passar o celular</button></div></main>; }

function Finished({ game, onReplay, onNewGame, onHome }: { game: SavedGame; onReplay: () => void; onNewGame: () => void; onHome: () => void }) { const sorted = [...game.teams].sort((a,b) => b.score - a.score); const winners = game.tieTeamIds.length === 1 ? game.teams.filter((team) => team.id === game.tieTeamIds[0]) : sorted.filter((team) => team.score === sorted[0].score); const mostCorrect = [...game.teams].sort((a,b) => b.totals.correct - a.totals.correct)[0]; const cleanest = [...game.teams].sort((a,b) => a.totals.forbidden - b.totals.forbidden)[0]; useEffect(() => { playCue("victory", game.settings.sound); vibrate([80,50,80,50,180], game.settings.vibration); }, [game.settings.sound, game.settings.vibration]); return <main className="finish-screen"><div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div><div className="mx-auto w-full max-w-2xl"><Crown className="mx-auto h-16 w-16 text-[var(--accent)]" /><p className="step-label mt-3">Fim de jogo</p><h1 className="font-display text-5xl font-black">{winners.length > 1 ? "Empate!" : `${winners[0]?.name} venceu!`}</h1><div className="score-list mt-8">{sorted.map((team, index) => <div className="score-row" key={team.id}><b className="rank">{index + 1}</b><TeamAvatar avatar={team.avatar} color={team.color} /><div className="flex-1 text-left"><b>{team.name}</b><span className="block">{team.totals.correct} acertos, {team.totals.skipped} pulos, {team.totals.forbidden} proibidas</span></div><strong>{team.score}</strong></div>)}</div><div className="award-grid"><div><Medal /><span>Mais acertos</span><b>{mostCorrect.name}</b></div><div><Trophy /><span>Menos penalidades</span><b>{cleanest.name}</b></div><div><RefreshCcw /><span>Melhor sequência</span><b>{Math.max(...game.teams.map((team) => team.totals.bestStreak))}</b></div></div><div className="mt-7 grid gap-3 sm:grid-cols-3"><button className="primary-button" onClick={onReplay}><RefreshCcw />Revanche</button><button className="secondary-button" onClick={onNewGame}><Settings2 />Nova partida</button><button className="ghost-button" onClick={onHome}><Home />Início</button></div></div></main>; }

function FullCenter({ children }: { children: React.ReactNode }) { return <main className="game-surface flex min-h-[100dvh] items-center justify-center px-4 py-[max(1rem,env(safe-area-inset-top))] text-center">{children}</main>; }
function Stat({ value, label }: { value: number; label: string }) { return <div><strong>{value}</strong><span>{label}</span></div>; }
