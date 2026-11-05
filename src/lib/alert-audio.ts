import { useSyncExternalStore } from "react";

type AudioContextCtor = typeof AudioContext;
type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

let context: AudioContext | null = null;
let unlocked = false;
let wakeLock: WakeLockSentinel | null = null;
const listeners = new Set<() => void>();

function setUnlocked(value: boolean) {
  unlocked = value;
  listeners.forEach((listener) => listener());
}

function confirmChime(ctx: AudioContext) {
  const t = ctx.currentTime + 0.02;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.setValueAtTime(1320, t + 0.12);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.5, t + 0.01);
  env.gain.linearRampToValueAtTime(0, t + 0.28);
  osc.connect(env).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

async function keepScreenOn() {
  if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch {
    wakeLock = null;
  }
}

function onVisible() {
  if (document.visibilityState !== "visible" || !unlocked) return;
  if (context && context.state !== "running") context.resume().catch(() => {});
  if (!wakeLock || wakeLock.released) keepScreenOn();
}

// Must run synchronously inside a user gesture: browsers only grant audio and vibration to a page the
// person has tapped, and iOS keeps the context muted unless a source starts within that same handler.
export function unlockAlertAudio(): void {
  if (unlocked) return;
  const session = (navigator as AudioSessionNavigator).audioSession;
  // iOS 17+: "playback" lets the alert sound even when the ring/silent switch is on silent.
  if (session) session.type = "playback";

  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (Ctor) {
    context ??= new Ctor();
    const silent = context.createBufferSource();
    silent.buffer = context.createBuffer(1, 1, 22050);
    silent.connect(context.destination);
    silent.start();
    if (context.state !== "running") context.resume().catch(() => {});
    confirmChime(context);
  }
  if (typeof navigator.vibrate === "function") navigator.vibrate(200);

  keepScreenOn();
  document.addEventListener("visibilitychange", onVisible);
  setUnlocked(true);
}

export function alertAudioContext(): AudioContext | null {
  return context;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAlertUnlocked(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => unlocked,
    () => false,
  );
}
