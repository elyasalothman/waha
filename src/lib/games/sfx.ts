const KEY = "waha:sfx";

let ctx: AudioContext | null = null;
let muted = false;
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  try {
    muted = localStorage.getItem(KEY) === "off";
  } catch {
    muted = false;
  }
  hydrated = true;
}

export function isSfxMuted(): boolean {
  hydrate();
  return muted;
}

export function setSfxMuted(next: boolean) {
  muted = next;
  hydrated = true;
  try {
    localStorage.setItem(KEY, next ? "off" : "on");
  } catch {
    /* ignore */
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  hydrate();
  if (muted) return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.045, delay = 0) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  tap() {
    tone(420, 0.05, "triangle", 0.03);
  },
  pour() {
    tone(220, 0.09, "sine", 0.04);
    tone(330, 0.07, "sine", 0.025, 0.04);
  },
  place() {
    tone(310, 0.07, "triangle", 0.035);
  },
  ok() {
    tone(520, 0.08, "sine", 0.04);
    tone(690, 0.1, "sine", 0.03, 0.06);
  },
  miss() {
    tone(160, 0.12, "sine", 0.04);
  },
  win() {
    tone(440, 0.1, "sine", 0.04);
    tone(554, 0.1, "sine", 0.035, 0.08);
    tone(659, 0.16, "sine", 0.04, 0.16);
  },
  clear() {
    tone(480, 0.08, "triangle", 0.035);
    tone(640, 0.1, "triangle", 0.03, 0.05);
  },
};

export function buzz(ms = 8) {
  if (typeof navigator === "undefined" || isSfxMuted()) return;
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}
