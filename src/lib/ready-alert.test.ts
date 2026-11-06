import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startReadyAlert } from "./ready-alert";

describe("startReadyAlert", () => {
  const vibrate = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vibrate.mockReset();
    vi.stubGlobal("navigator", { vibrate });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("vibrates immediately and every 2s without an audio context", () => {
    const stop = startReadyAlert(null);
    vi.advanceTimersByTime(4000);
    expect(vibrate.mock.calls).toEqual([
      [[300, 150, 300, 150, 600]],
      [[300, 150, 300, 150, 600]],
      [[300, 150, 300, 150, 600]],
    ]);
    stop();
  });

  it("stop cancels vibration and the loop", () => {
    const stop = startReadyAlert(null);
    stop();
    vi.advanceTimersByTime(10_000);
    expect(vibrate.mock.calls).toEqual([[[300, 150, 300, 150, 600]], [0]]);
  });

  it("plays a custom clip instead of beeps and waits for it to finish before repeating", () => {
    const starts: string[] = [];
    const node = () => ({ connect: (n: unknown) => n ?? node(), disconnect: () => {}, gain: { value: 0 } });
    const ctx = {
      currentTime: 0,
      destination: {},
      createGain: node,
      createOscillator: () => ({ ...node(), frequency: {}, start: () => starts.push("beep"), stop: () => {} }),
      createBufferSource: () => ({ ...node(), buffer: null, start: () => starts.push("clip") }),
    } as unknown as AudioContext;
    const clip = { duration: 3 } as AudioBuffer;
    const stop = startReadyAlert(ctx, clip);
    vi.advanceTimersByTime(3299);
    expect(starts).toEqual(["clip"]);
    vi.advanceTimersByTime(1);
    expect(starts).toEqual(["clip", "clip"]);
    stop();
  });

  it("works where vibrate is unsupported", () => {
    vi.stubGlobal("navigator", {});
    const stop = startReadyAlert(null);
    vi.advanceTimersByTime(4000);
    stop();
    expect(vibrate).not.toHaveBeenCalled();
  });
});
