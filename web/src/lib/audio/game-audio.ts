import type { ActionKind } from "@/types/game";

type Cue = ActionKind | "tick" | "start" | "finish" | "victory";
const notes: Record<Cue, [number, number, OscillatorType]> = {
  correct: [660, .08, "sine"], skip: [330, .07, "triangle"], forbidden: [150, .14, "sawtooth"],
  tick: [520, .045, "square"], start: [820, .12, "sine"], finish: [120, .3, "sawtooth"], victory: [980, .28, "triangle"],
};
let context: AudioContext | null = null;
export function playCue(cue: Cue, enabled: boolean): void {
  if (!enabled || typeof window === "undefined") return;
  try {
    context ??= new AudioContext();
    const [frequency, duration, type] = notes[cue];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency; oscillator.type = type;
    gain.gain.setValueAtTime(.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + duration);
  } catch {}
}
export function vibrate(pattern: number | number[], enabled: boolean): void { if (enabled && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern); }
