/** Hide the top bar only after a real downward move, and bring it back on the way up or at the top. */
export function nextHeaderHidden(
  hidden: boolean,
  y: number,
  delta: number,
  acc: number,
): { hidden: boolean; acc: number } {
  if (y <= 8) return { hidden: false, acc: 0 };
  if (!Number.isFinite(delta) || delta === 0) return { hidden, acc };
  const nextAcc = acc === 0 || Math.sign(delta) === Math.sign(acc) ? acc + delta : delta;
  if (nextAcc > 24) return { hidden: true, acc: nextAcc };
  if (nextAcc < -24) return { hidden: false, acc: nextAcc };
  return { hidden, acc: nextAcc };
}
