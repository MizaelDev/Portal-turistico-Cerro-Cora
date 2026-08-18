"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BookOpen, Check, ChevronDown, ChevronUp, Clock3, Gamepad2, HelpCircle, Palette, Plus, Shuffle, Sparkles, Trash2, Users, Zap } from "lucide-react";
import { useState } from "react";
import { makeTeam, TEAM_AVATARS, TEAM_COLORS, TEAM_NAMES } from "@/lib/game-engine";
import { CATEGORIES, DEFAULT_SETTINGS, type GameMode, type GameSettings, type Team, type ThemeId } from "@/types/game";
import { TeamAvatar } from "./team-avatar";

const THEMES: { id: ThemeId; name: string; mark: string }[] = [
  { id: "arcade", name: "Arcade neon", mark: "AR" }, { id: "junina", name: "Festa junina", mark: "FJ" },
  { id: "space", name: "Espaço sideral", mark: "ES" }, { id: "football", name: "Futebol", mark: "FU" },
  { id: "spooky", name: "Terror divertido", mark: "TD" }, { id: "minimal", name: "Minimalista", mark: "MI" },
];

const MODES = [
  { id: "classic" as const, name: "Clássico", tag: "Clássico", icon: Gamepad2, description: "Equipes alternam as dicas no ritmo que você escolher.", duration: "15-35 min", people: "4-12 jogadores" },
  { id: "lightning" as const, name: "Relâmpago", tag: "Rápido", icon: Zap, description: "30 segundos e só dois pulos. Pense depressa.", duration: "8-18 min", people: "2-8 jogadores" },
  { id: "chaos" as const, name: "Caos leve", tag: "Divertido", icon: Sparkles, description: "Cada rodada traz uma regra surpresa para bagunçar tudo.", duration: "18-40 min", people: "4-12 jogadores" },
];

type View = "home" | "howTo" | "mode" | "teams" | "settings";

export function SetupFlow({ hasSaved, initialTheme, onTheme, onContinue, onDiscard, onStart }: {
  hasSaved: boolean; initialTheme: ThemeId; onTheme: (theme: ThemeId) => void; onContinue: () => void; onDiscard: () => void; onStart: (mode: GameMode, teams: Team[], settings: GameSettings) => void;
}) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("home");
  const [mode, setMode] = useState<GameMode>("classic");
  const [teams, setTeams] = useState<Team[]>([makeTeam(0), makeTeam(1)]);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS, theme: initialTheme });
  const title = view === "mode" ? "Escolha o ritmo" : view === "teams" ? "Monte as equipes" : view === "settings" ? "Ajuste a partida" : "";
  const goTheme = (theme: ThemeId) => { setSettings((value) => ({ ...value, theme })); onTheme(theme); };
  const updateTeam = (index: number, patch: Partial<Team>) => setTeams((value) => value.map((team, i) => i === index ? { ...team, ...patch } : team));
  const randomName = (index: number) => updateTeam(index, { name: TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)] });
  const move = (index: number, offset: number) => setTeams((value) => { const next = [...value]; const target = index + offset; if (target < 0 || target >= next.length) return value; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const validTeams = teams.every((team) => team.name.trim());

  return (
    <main className="game-surface min-h-[100dvh] overflow-x-hidden px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-[var(--ink)]">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col">
        {view !== "home" && view !== "howTo" ? (
          <header className="mb-5 flex items-center gap-3 pt-1">
            <button className="icon-button" aria-label="Voltar" onClick={() => setView(view === "mode" ? "home" : view === "teams" ? "mode" : "teams")}><ArrowLeft /></button>
            <div><p className="step-label">{view === "mode" ? "Primeiro" : view === "teams" ? "Depois" : "Por último"}</p><h1 className="font-display text-2xl font-black sm:text-3xl">{title}</h1></div>
          </header>
        ) : null}
        <AnimatePresence mode="wait">
          {view === "home" ? (
            <motion.section key="home" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid flex-1 items-center gap-8 py-5 md:grid-cols-[1.05fr_.95fr]">
              <div className="relative z-10">
                <div className="brand-lockup" aria-label="Não Fala"><span>NÃO</span><span>FALA!</span></div>
                <p className="mt-5 max-w-md text-lg font-semibold leading-snug text-[var(--muted)]">Faça sua equipe adivinhar. As cinco palavras mais óbvias estão proibidas.</p>
                <div className="mt-7 grid max-w-sm gap-3">
                  <button className="primary-button" onClick={() => setView("mode")}><Gamepad2 />Jogar agora</button>
                  {hasSaved ? <button className="secondary-button" onClick={onContinue}><Clock3 />Continuar partida</button> : null}
                  <button className="ghost-button" onClick={() => setView("howTo")}><HelpCircle />Como jogar</button>
                </div>
                {hasSaved ? <button className="mt-4 text-sm font-bold text-[var(--muted)] underline underline-offset-4" onClick={onDiscard}>Descartar partida salva</button> : null}
              </div>
              <DemoCard />
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-sm font-extrabold"><Palette className="h-4 w-4" />Tema rápido</div>
                <div className="theme-strip" aria-label="Escolher tema">{THEMES.map((theme) => <button key={theme.id} aria-label={theme.name} title={theme.name} data-active={settings.theme === theme.id} onClick={() => goTheme(theme.id)}><span>{theme.mark}</span></button>)}</div>
              </div>
            </motion.section>
          ) : null}
          {view === "howTo" ? (
            <motion.section key="how" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-6">
              <button className="icon-button mb-6" aria-label="Voltar" onClick={() => setView("home")}><ArrowLeft /></button>
              <div className="grid items-center gap-7 md:grid-cols-2">
                <div><BookOpen className="mb-4 h-9 w-9 text-[var(--accent)]" /><h1 className="font-display text-4xl font-black">Dê pistas.<br />Fuja das proibidas.</h1><ol className="mt-6 grid gap-4 text-[var(--muted)]"><li><b>1.</b> Uma pessoa vê a carta.</li><li><b>2.</b> A equipe tenta adivinhar a palavra principal.</li><li><b>3.</b> As cinco palavras da lista não podem ser faladas.</li><li><b>4.</b> Acertos somam pontos. Proibidas tiram pontos.</li><li><b>5.</b> Quando o tempo acaba, a vez passa.</li></ol></div>
                <DemoCard />
              </div>
            </motion.section>
          ) : null}
          {view === "mode" ? (
            <motion.section key="mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid gap-4 md:grid-cols-3">{MODES.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setMode(item.id); if (item.id === "lightning") setSettings((value) => ({ ...value, seconds: 30, skipLimit: 2 })); setView("teams"); }} className="mode-card text-left"><span className="mode-tag">{item.tag}</span><Icon className="mt-8 h-9 w-9 text-[var(--accent)]" /><h2 className="mt-4 font-display text-3xl font-black">{item.name}</h2><p className="mt-3 min-h-16 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p><div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-extrabold"><span><Clock3 />{item.duration}</span><span><Users />{item.people}</span></div></button>; })}</motion.section>
          ) : null}
          {view === "teams" ? (
            <motion.section key="teams" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-28">
              <div className="grid gap-4 md:grid-cols-2">{teams.map((team, index) => <div className="team-editor" key={team.id}><div className="flex items-center gap-3"><TeamAvatar avatar={team.avatar} color={team.color} className="h-8 w-8" /><input aria-label={`Nome da equipe ${index + 1}`} value={team.name} maxLength={28} onChange={(event) => updateTeam(index, { name: event.target.value })} /><div className="flex"><button aria-label="Subir equipe" onClick={() => move(index, -1)} disabled={index === 0}><ChevronUp /></button><button aria-label="Descer equipe" onClick={() => move(index, 1)} disabled={index === teams.length - 1}><ChevronDown /></button></div></div><div className="mt-4 flex flex-wrap gap-2">{TEAM_COLORS.map((color) => <button key={color} aria-label={`Cor ${color}`} className="color-choice" data-active={team.color === color} style={{ background: color }} onClick={() => updateTeam(index, { color })} />)}<button className="mini-button" onClick={() => randomName(index)}><Shuffle />Nome</button>{teams.length > 2 ? <button className="mini-button danger" onClick={() => setTeams((value) => value.filter((_, i) => i !== index))}><Trash2 />Remover</button> : null}</div><div className="mt-3 flex gap-2 overflow-x-auto">{TEAM_AVATARS.map((avatar) => <button key={avatar} aria-label={`Avatar ${avatar}`} className="avatar-choice" data-active={team.avatar === avatar} onClick={() => updateTeam(index, { avatar })}><TeamAvatar avatar={avatar} color={team.avatar === avatar ? team.color : undefined} /></button>)}</div><label className="mt-4 block text-xs font-extrabold text-[var(--muted)]">Jogadores opcionais, separados por vírgula<PlayerNamesInput players={team.players} onChange={(players) => updateTeam(index, { players })} /></label></div>)}</div>
              {teams.length < 6 ? <button className="secondary-button mx-auto mt-5" onClick={() => setTeams((value) => [...value, makeTeam(value.length)])}><Plus />Adicionar equipe</button> : null}
              {!validTeams ? <p role="alert" className="mt-3 text-center text-sm font-bold text-red-600">Toda equipe precisa de um nome.</p> : null}
              <BottomAction disabled={!validTeams} onClick={() => setView("settings")}>Configurar partida</BottomAction>
            </motion.section>
          ) : null}
          {view === "settings" ? (
            <motion.section key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-28">
              <div className="settings-grid">
                <Field title="Rodadas"><Choice values={[2,3,4,5,6,8]} selected={settings.rounds} onChange={(rounds) => setSettings({ ...settings, rounds })} /></Field>
                <Field title="Tempo por rodada"><Choice values={mode === "lightning" ? [30] : [30,45,60,90]} selected={mode === "lightning" ? 30 : settings.seconds} suffix="s" onChange={(seconds) => setSettings({ ...settings, seconds })} /></Field>
                <Field title="Dificuldade"><Choice values={["easy","medium","hard","mixed"]} labels={["Fácil","Média","Difícil","Misturada"]} selected={settings.difficulty} onChange={(difficulty) => setSettings({ ...settings, difficulty })} /></Field>
                <Field title="Limite de pulos"><Choice values={[null,1,2,3,5]} labels={["Livre","1","2","3","5"]} selected={mode === "lightning" ? 2 : settings.skipLimit} onChange={(skipLimit) => setSettings({ ...settings, skipLimit })} /></Field>
                <Field title="Categorias" wide><div className="category-grid">{CATEGORIES.map((category) => <button key={category} data-active={settings.categories.includes(category)} onClick={() => setSettings((value) => ({ ...value, categories: value.categories.includes(category) ? value.categories.filter((item) => item !== category) : [...value.categories, category] }))}><Check />{category}</button>)}</div></Field>
                <Field title="Tema" wide><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{THEMES.map((theme) => <button className="theme-option" data-active={settings.theme === theme.id} key={theme.id} onClick={() => goTheme(theme.id)}><span>{theme.mark}</span>{theme.name}</button>)}</div></Field>
                <Field title="Preferências" wide><div className="toggle-grid"><Toggle label="Sons" checked={settings.sound} onChange={(sound) => setSettings({ ...settings, sound })} /><Toggle label="Vibração" checked={settings.vibration} onChange={(vibration) => setSettings({ ...settings, vibration })} /><Toggle label="Gestos" checked={settings.gestures} onChange={(gestures) => setSettings({ ...settings, gestures })} /><Toggle label="Pular tira 1 ponto" checked={settings.skipPenalty} onChange={(skipPenalty) => setSettings({ ...settings, skipPenalty })} /><Toggle label="Confirmar abandono" checked={settings.confirmAbandon} onChange={(confirmAbandon) => setSettings({ ...settings, confirmAbandon })} /><Toggle label="Reduzir animações" checked={settings.reducedMotion} onChange={(reducedMotion) => setSettings({ ...settings, reducedMotion })} /><Toggle label="Fonte maior" checked={settings.largeText} onChange={(largeText) => setSettings({ ...settings, largeText })} />{mode === "chaos" ? <Toggle label="Regras especiais" checked={settings.chaosRules} onChange={(chaosRules) => setSettings({ ...settings, chaosRules })} /> : null}</div></Field>
              </div>
              {!settings.categories.length ? <p role="alert" className="mt-4 text-center text-sm font-bold text-red-600">Escolha pelo menos uma categoria.</p> : null}
              <BottomAction disabled={!settings.categories.length} onClick={() => onStart(mode, teams, settings)}>Começar partida</BottomAction>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

function DemoCard() { return <motion.div className="demo-card" initial={{ rotate: 3, scale: .96 }} animate={{ rotate: -2, scale: 1 }} transition={{ type: "spring", stiffness: 160, damping: 16 }}><div className="card-tape" /><p>COMIDAS</p><h2>PIPOCA</h2><div className="forbidden-demo"><span>Milho</span><span>Cinema</span><span>Estourar</span><span>Panela</span><span>Manteiga</span></div><div className="card-stamp">NÃO<br />FALA!</div></motion.div>; }
function BottomAction({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) { return <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-[var(--bg)]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur"><button className="primary-button mx-auto max-w-md" disabled={disabled} onClick={onClick}>{children}</button></div>; }
function Field({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) { return <section className={wide ? "md:col-span-2" : ""}><h2 className="mb-3 text-sm font-black">{title}</h2>{children}</section>; }
function Choice<T extends string | number | null>({ values, labels, selected, suffix = "", onChange }: { values: T[]; labels?: string[]; selected: T; suffix?: string; onChange: (value: T) => void }) { return <div className="choice-row">{values.map((value, index) => <button key={String(value)} data-active={selected === value} onClick={() => onChange(value)}>{labels?.[index] ?? `${value}${suffix}`}</button>)}</div>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>; }
function PlayerNamesInput({ players, onChange }: { players: string[]; onChange: (players: string[]) => void }) {
  const [value, setValue] = useState(() => players.join(", "));
  return <input className="mt-2" value={value} onChange={(event) => { const raw = event.target.value; setValue(raw); onChange(raw.split(",").map((name) => name.trim()).filter(Boolean)); }} placeholder="Bia, Caio, Duda" />;
}
