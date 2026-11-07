export type AccountProviderPhase = "checking" | "unknown" | "ready";

/** Loading and a failed status read are not the same as a server that confirmed the providers are off. */
export function accountProviderView(input: {
  phase: AccountProviderPhase;
  google?: boolean;
  apple?: boolean;
}): "checking" | "unknown" | "off" | "on" {
  if (input.phase === "checking") return "checking";
  if (input.phase === "unknown") return "unknown";
  if (input.google || input.apple) return "on";
  return "off";
}
