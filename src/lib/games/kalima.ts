export type Tone = "correct" | "present" | "absent";

export function scoreGuess(guess: string, answer: string): Tone[] {
  const a = [...answer];
  const g = [...guess];
  const n = Math.max(a.length, g.length);
  const out: Tone[] = Array(n).fill("absent");
  const used = Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (g[i] === a[i]) {
      out[i] = "correct";
      used[i] = true;
    }
  }
  for (let i = 0; i < n; i++) {
    if (out[i] === "correct") continue;
    const j = a.findIndex((ch, idx) => !used[idx] && ch === g[i]);
    if (j >= 0) {
      out[i] = "present";
      used[j] = true;
    }
  }
  return out;
}

export function keyTones(guesses: string[], answer: string): Record<string, Tone> {
  const rank: Record<Tone, number> = { absent: 0, present: 1, correct: 2 };
  const best: Record<string, Tone> = {};
  for (const guess of guesses) {
    const tones = scoreGuess(guess, answer);
    [...guess].forEach((ch, i) => {
      const tone = tones[i]!;
      const prev = best[ch];
      if (!prev || rank[tone] > rank[prev]) best[ch] = tone;
    });
  }
  return best;
}

export const AR_ALPHA = "أابتثجحخدذرزسشصضطظعغفقكلمنهويىة".split("");
export const EN_ALPHA = "qwertyuiopasdfghjklzxcvbnm".split("");

const ALLOWED = new Set([...AR_ALPHA, ...EN_ALPHA]);

export function lettersOk(word: string): boolean {
  return [...word].every((ch) => ALLOWED.has(ch));
}
