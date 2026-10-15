/** Saudi tournament scoring: https://enjoy.sa/media/j1ofreng/baloot.pdf (§4–7). */
export type Team = 0 | 1;
export type Projects = {
  sara: number;
  fifty: number;
  hundred: number;
  fourHundred: number;
  baloot: number;
};
export type Hand = {
  mode: "hokom" | "sun";
  buyer: Team;
  raw: number;
  projects: [Projects, Projects];
  level: 1 | 2 | 3 | 4 | 5;
  kaboot: Team | null;
  buyerLost: boolean;
};
export const noProjects = (): Projects => ({
  sara: 0,
  fifty: 0,
  hundred: 0,
  fourHundred: 0,
  baloot: 0,
});
export const newHand = (): Hand => ({
  mode: "hokom",
  buyer: 0,
  raw: 100,
  projects: [noProjects(), noProjects()],
  level: 1,
  kaboot: null,
  buyerLost: false,
});
export function projectPoints(p: Projects, mode: Hand["mode"]) {
  return (
    (p.sara * 2 + p.fifty * 5 + p.hundred * 10 + (mode === "sun" ? p.fourHundred * 20 : 0)) *
    (mode === "sun" ? 2 : 1)
  );
}
export function scoreHand(h: Hand): {
  points: [number, number];
  coffee: Team | null;
  failed: boolean;
  tied: boolean;
} {
  const sun = h.mode === "sun",
    total = sun ? 130 : 162,
    base = sun ? 26 : 16;
  if (!Number.isInteger(h.raw) || h.raw < 0 || h.raw > total)
    throw new Error("الأبناط خارج النطاق");
  if (![1, 2, 3, 4, 5].includes(h.level) || (sun && h.level > 2))
    throw new Error("الصن يسمح بالدبل فقط");
  for (const p of h.projects) {
    for (const v of Object.values(p))
      if (!Number.isInteger(v) || v < 0 || v > 4) throw new Error("مشروع غير صالح");
    if (p.baloot > 1 || (sun && p.baloot) || (!sun && p.fourHundred))
      throw new Error("المشروع لا يناسب نوع اللعب");
  }
  if (!Array.isArray(h.projects) || h.projects.length !== 2) throw new Error("مشاريع غير صالحة");
  const projects = h.projects.map((p) => projectPoints(p, h.mode));
  if (projects[0] && projects[1])
    throw new Error("أدخل المشاريع المعتمدة للفريق صاحب المشروع الأكبر فقط");
  if (h.projects[0].baloot + h.projects[1].baloot > 1) throw new Error("البلوت لفريق واحد فقط");
  const baloot = h.projects.map((p) => (sun ? 0 : p.baloot * 2));
  const factor = h.level === 5 ? 1 : h.level;
  const projectFactor = h.level === 2 ? 2 : 1;
  const other = (1 - h.buyer) as Team;
  const raw = [h.raw, total - h.raw];
  const strength = raw.map((n, i) => n + (projects[i] + baloot[i]) * (sun ? 5 : 10));
  const tied = strength[0] === strength[1];
  const failed = h.buyerLost || strength[h.buyer] < strength[other];
  const points: [number, number] = [0, 0];
  let winner: Team | null = null;
  if (h.kaboot !== null) {
    winner = h.kaboot;
    points[winner] = (sun ? 44 : 25) + projects[winner] * projectFactor + baloot[winner];
  } else if (h.level > 1 || failed) {
    winner = failed ? other : h.buyer;
    points[winner] =
      base * factor + (projects[0] + projects[1]) * projectFactor + baloot[0] + baloot[1];
  } else {
    // Count the non-buyer; the buyer receives the remainder. Sun rounds 5 up, hokom 5 down.
    const counted = Math.floor((raw[other] + (sun ? 2.5 : 4)) / (sun ? 5 : 10));
    points[other] = counted + projects[other] + baloot[other];
    points[h.buyer] = base - counted + projects[h.buyer] + baloot[h.buyer];
  }
  return { points, coffee: h.level === 5 ? winner : null, failed, tied };
}
export type SavedHand = { id: string; hand: Hand };
export function matchScore(rounds: SavedHand[]) {
  const totals: [number, number] = [0, 0];
  let winner: Team | null = null;
  for (const round of rounds) {
    const score = scoreHand(round.hand);
    totals[0] += score.points[0];
    totals[1] += score.points[1];
    if (score.coffee !== null) winner = score.coffee;
  }
  if (winner === null && Math.max(...totals) >= 152 && totals[0] !== totals[1])
    winner = totals[0] > totals[1] ? 0 : 1;
  return { totals, winner };
}
export function validGame(raw: unknown): { names: [string, string]; rounds: SavedHand[] } | null {
  try {
    const g = raw as { names: [string, string]; rounds: SavedHand[] };
    if (
      !Array.isArray(g.names) ||
      g.names.length !== 2 ||
      g.names.some((n) => typeof n !== "string" || n.length > 30) ||
      !Array.isArray(g.rounds)
    )
      return null;
    for (const r of g.rounds) {
      if (
        typeof r.id !== "string" ||
        ![0, 1].includes(r.hand.buyer) ||
        !["hokom", "sun"].includes(r.hand.mode) ||
        ![null, 0, 1].includes(r.hand.kaboot) ||
        typeof r.hand.buyerLost !== "boolean"
      )
        return null;
      scoreHand(r.hand);
    }
    return g;
  } catch {
    return null;
  }
}
