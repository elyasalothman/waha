/** جيش الواحة — local progress (coins, upgrades, unlocked level, endless best). */
import type { Upgrades } from "./engine.ts";

export const SAVE_KEY = "waha:army:v1";

export type ArmySave = {
  coins: number;
  unlocked: number; // highest playable level (1..11, 11 = endless open)
  upgrades: Upgrades;
  endlessBest: number;
  bestArmy: number;
};

export const UPGRADE_MAX: Record<keyof Upgrades, number> = { start: 20, rate: 15, income: 10 };

export function upgradeCost(kind: keyof Upgrades, level: number): number {
  if (kind === "start") return Math.round(30 * Math.pow(1.38, level));
  if (kind === "rate") return Math.round(40 * Math.pow(1.42, level));
  return Math.round(50 * Math.pow(1.5, level));
}

export function emptySave(): ArmySave {
  return { coins: 0, unlocked: 1, upgrades: { start: 0, rate: 0, income: 0 }, endlessBest: 0, bestArmy: 0 };
}

const int = (v: unknown, lo: number, hi: number, d: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d;
};

export function parseSave(raw: string | null): ArmySave {
  const d = emptySave();
  if (!raw) return d;
  try {
    const j = JSON.parse(raw) as Partial<ArmySave> & { upgrades?: Partial<Upgrades> };
    return {
      coins: int(j.coins, 0, 1e9, 0),
      unlocked: int(j.unlocked, 1, 11, 1),
      upgrades: {
        start: int(j.upgrades?.start, 0, UPGRADE_MAX.start, 0),
        rate: int(j.upgrades?.rate, 0, UPGRADE_MAX.rate, 0),
        income: int(j.upgrades?.income, 0, UPGRADE_MAX.income, 0),
      },
      endlessBest: int(j.endlessBest, 0, 1e6, 0),
      bestArmy: int(j.bestArmy, 0, 1e6, 0),
    };
  } catch {
    return d;
  }
}

export function loadSave(): ArmySave {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return emptySave();
  }
}

export function writeSave(s: ArmySave) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: progress stays in memory */
  }
}

/** Returns a new save with the upgrade bought, or null if not affordable / maxed. */
export function buyUpgrade(s: ArmySave, kind: keyof Upgrades): ArmySave | null {
  const lvl = s.upgrades[kind];
  if (lvl >= UPGRADE_MAX[kind]) return null;
  const cost = upgradeCost(kind, lvl);
  if (s.coins < cost) return null;
  return { ...s, coins: s.coins - cost, upgrades: { ...s.upgrades, [kind]: lvl + 1 } };
}
