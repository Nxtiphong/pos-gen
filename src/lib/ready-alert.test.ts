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

  it("works where vibrate is unsupported", () => {
    vi.stubGlobal("navigator", {});
    const stop = startReadyAlert(null);
    vi.advanceTimersByTime(4000);
    stop();
    expect(vibrate).not.toHaveBeenCalled();
  });
});
