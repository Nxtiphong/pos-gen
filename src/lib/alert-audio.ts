type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

export async function unlockAlertAudio(): Promise<boolean> {
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return false;
  context ??= new Ctor();
  // iOS Safari keeps the context muted until a source starts inside the tap handler itself.
  const silent = context.createBufferSource();
  silent.buffer = context.createBuffer(1, 1, 22050);
  silent.connect(context.destination);
  silent.start();
  if (context.state !== "running") await context.resume();
  return context.state === "running";
}

export function alertAudioContext(): AudioContext | null {
  return context;
}
