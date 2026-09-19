const MUTE_KEY = "waha:sfx-muted";

type Kind = "tap" | "ok" | "win" | "miss" | "place" | "clear";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export function sfxMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSfxMuted(next: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function tone(freq: number, dur: number, gain = 0.05, type: OscillatorType = "sine", delay = 0) {
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + delay;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playSfx(kind: Kind) {
  if (sfxMuted()) return;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  switch (kind) {
    case "tap":
      tone(420, 0.045, 0.035, "triangle");
      break;
    case "place":
      tone(380, 0.06, 0.04, "sine");
      break;
    case "ok":
      tone(620, 0.07, 0.045, "sine");
      tone(880, 0.08, 0.03, "sine", 0.04);
      break;
    case "clear":
      tone(520, 0.06, 0.04, "sine");
      tone(740, 0.08, 0.035, "sine", 0.05);
      break;
    case "win":
      tone(523, 0.09, 0.045, "sine");
      tone(659, 0.1, 0.04, "sine", 0.08);
      tone(784, 0.14, 0.04, "sine", 0.16);
      break;
    case "miss":
      tone(180, 0.12, 0.04, "sine");
      break;
  }
}
