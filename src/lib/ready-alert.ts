export const READY_ALERT_CYCLE_MS = 2000;
export const READY_VIBRATION = [300, 150, 300, 150, 600];

const BEEPS: { at: number; hz: number }[] = [
  { at: 0, hz: 1320 },
  { at: 0.22, hz: 880 },
  { at: 0.44, hz: 1320 },
  { at: 0.66, hz: 880 },
];
const BEEP_SECONDS = 0.18;

function beepCycle(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.02;
  for (const { at, hz } of BEEPS) {
    const t = start + at;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = hz;
    // Short ramps avoid the click a hard gain step makes on most phone speakers.
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 0.01);
    env.gain.setValueAtTime(1, t + BEEP_SECONDS - 0.02);
    env.gain.linearRampToValueAtTime(0, t + BEEP_SECONDS);
    osc.connect(env).connect(out);
    osc.start(t);
    osc.stop(t + BEEP_SECONDS);
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
}

function playClip(ctx: AudioContext, out: AudioNode, clip: AudioBuffer) {
  const source = ctx.createBufferSource();
  source.buffer = clip;
  source.connect(out);
  source.start(ctx.currentTime + 0.02);
}

export function startReadyAlert(ctx: AudioContext | null, clip: AudioBuffer | null = null): () => void {
  const master = ctx?.createGain();
  if (ctx && master) {
    master.gain.value = clip ? 1 : 0.6;
    master.connect(ctx.destination);
  }

  const cycle = () => {
    if (ctx && master) {
      if (clip) playClip(ctx, master, clip);
      else beepCycle(ctx, master);
    }
    vibrate(READY_VIBRATION);
  };

  cycle();
  const cycleMs = clip ? Math.max(READY_ALERT_CYCLE_MS, Math.ceil(clip.duration * 1000) + 300) : READY_ALERT_CYCLE_MS;
  const timer = setInterval(cycle, cycleMs);

  return () => {
    clearInterval(timer);
    master?.disconnect();
    vibrate(0);
  };
}
