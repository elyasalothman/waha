export function weightedScore(scores: number[], weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + Math.max(0, Number.isFinite(w) ? w : 0), 0);
  if (!total) return 0;
  return (
    scores.reduce(
      (sum, score, i) =>
        sum +
        Math.min(10, Math.max(0, Number.isFinite(score) ? score : 0)) *
          Math.max(0, Number.isFinite(weights[i]) ? weights[i] : 0),
      0,
    ) / total
  );
}
