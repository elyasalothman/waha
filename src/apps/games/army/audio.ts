/**
 * جيش الواحة — every sound is synthesised here with WebAudio (no audio files).
 * Music: a soft maqsum rhythm (dum/tak) with an oud-like pluck in maqam Hijaz.
 */
import { isSfxMuted, setSfxMuted } from "@/lib/games/sfx";

type Ctx = AudioContext;

export class ArmyAudio {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private last: Record<string, number> = {};
  private musicTimer: number | null = null;
  private nextBeat = 0;
  private beat = 0;
  private note = 0;
  muted = isSfxMuted();
  musicLevel = 0.5;

  /** Must be called from a user gesture (iOS). */
  unlock() {
    if (this.muted) return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16 * this.musicLevel;
      this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    setSfxMuted(m);
    if (m) {
      this.stopMusic();
      if (this.ctx) void this.ctx.suspend();
    } else {
      this.unlock();
    }
  }

  setMusicLevel(v: number) {
    this.musicLevel = v;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(0.16 * v, this.ctx.currentTime, 0.3);
  }

  private ok(key: string, gapMs: number) {
    if (this.muted || !this.ctx || !this.master || this.ctx.state !== "running") return false;
    const now = performance.now();
    if ((this.last[key] ?? 0) + gapMs > now) return false;
    this.last[key] = now;
    return true;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, t0 = 0, slideTo?: number, dest?: AudioNode) {
    const c = this.ctx!;
    const t = c.currentTime + t0;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest ?? this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private hiss(dur: number, vol: number, filter: BiquadFilterType, freq: number, t0 = 0, q = 1, dest?: AudioNode, sweepTo?: number) {
    const c = this.ctx!;
    const t = c.currentTime + t0;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest ?? this.master!);
    s.start(t, Math.random() * 0.3);
    s.stop(t + dur + 0.02);
  }

  /** Oud-ish pluck: two detuned triangles with a fast decay. */
  private pluck(freq: number, t0: number, vol: number, dest?: AudioNode) {
    this.tone(freq, 0.5, "triangle", vol, t0, undefined, dest);
    this.tone(freq * 2.003, 0.18, "sine", vol * 0.35, t0, undefined, dest);
  }

  twang() {
    if (!this.ok("twang", 70)) return;
    this.tone(720 + Math.random() * 160, 0.09, "triangle", 0.05, 0, 240);
    this.hiss(0.06, 0.03, "highpass", 3000);
  }

  gate(good: boolean) {
    if (!this.ok("gate", 120)) return;
    if (good) [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.12, i * 0.055));
    else {
      this.tone(220, 0.35, "sawtooth", 0.08, 0, 90);
      this.tone(164, 0.4, "square", 0.04, 0.05, 70);
    }
  }

  grow() {
    if (!this.ok("grow", 60)) return;
    this.tone(880 + Math.random() * 200, 0.08, "sine", 0.05);
  }

  clash() {
    if (!this.ok("clash", 55)) return;
    this.hiss(0.08, 0.12, "bandpass", 900 + Math.random() * 900, 0, 2.5);
    this.tone(140, 0.07, "square", 0.03, 0, 80);
  }

  bow() {
    if (!this.ok("bow", 200)) return;
    [784, 988, 1175, 1568, 1976].forEach((f, i) => this.tone(f, 0.3, "sine", 0.09, i * 0.06));
  }

  fire() {
    if (!this.ok("fire", 300)) return;
    this.hiss(0.6, 0.18, "lowpass", 3000, 0, 1, undefined, 300);
  }

  slam() {
    if (!this.ok("slam", 200)) return;
    this.tone(70, 0.5, "sine", 0.35, 0, 35);
    this.hiss(0.35, 0.2, "lowpass", 900, 0, 1, undefined, 120);
  }

  volley() {
    if (!this.ok("volley", 200)) return;
    for (let i = 0; i < 4; i++) this.hiss(0.25, 0.05, "bandpass", 2400 - i * 300, i * 0.05, 3);
  }

  bossHit() {
    if (!this.ok("bossHit", 90)) return;
    this.tone(300 + Math.random() * 80, 0.06, "square", 0.03, 0, 180);
  }

  coin() {
    if (!this.ok("coin", 40)) return;
    this.tone(1318, 0.12, "sine", 0.08);
    this.tone(1975, 0.18, "sine", 0.06, 0.06);
  }

  tap() {
    if (!this.ok("tap", 40)) return;
    this.tone(600, 0.05, "sine", 0.06);
  }

  /** Hijaz on D: D Eb F# G A Bb C D */
  private static HIJAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];

  win() {
    if (!this.ok("end", 500)) return;
    const s = ArmyAudio.HIJAZ;
    [0, 2, 4, 7, 4, 7].forEach((k, i) => this.pluck(s[k] * (i > 3 ? 2 : 1), i * 0.14, 0.16));
    this.hiss(0.9, 0.05, "highpass", 6000, 0.6);
  }

  lose() {
    if (!this.ok("end", 500)) return;
    const s = ArmyAudio.HIJAZ;
    [7, 5, 3, 1, 0].forEach((k, i) => this.pluck(s[k], i * 0.18, 0.13));
  }

  startMusic() {
    if (this.muted || !this.ctx || this.musicTimer != null) return;
    this.nextBeat = this.ctx.currentTime + 0.1;
    const tick = () => {
      if (!this.ctx || this.muted) return;
      while (this.nextBeat < this.ctx.currentTime + 0.25) {
        this.scheduleBeat(this.nextBeat);
        this.nextBeat += 60 / 104 / 2; // eighth notes at 104 bpm
      }
    };
    this.musicTimer = window.setInterval(tick, 90);
  }

  stopMusic() {
    if (this.musicTimer != null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private scheduleBeat(t: number) {
    const c = this.ctx!;
    const dest = this.musicGain!;
    const rel = t - c.currentTime;
    // maqsum: D T - T D - T - (8 eighths)
    const pat = ["D", "T", "", "T", "D", "", "T", ""];
    const p = pat[this.beat % 8];
    if (p === "D") {
      this.tone(95, 0.22, "sine", 0.5, rel, 55, dest);
    } else if (p === "T") {
      this.hiss(0.05, 0.22, "highpass", 2500, rel, 1, dest);
    }
    // melody every quarter, gentle random walk on Hijaz
    if (this.beat % 2 === 0 && Math.random() < 0.7) {
      const s = ArmyAudio.HIJAZ;
      this.note = Math.max(0, Math.min(7, this.note + [-1, 1, 1, -2, 2, 0][Math.floor(Math.random() * 6)]));
      this.pluck(s[this.note] / 2, rel, 0.22, dest);
    }
    this.beat++;
  }

  dispose() {
    this.stopMusic();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
  }
}
