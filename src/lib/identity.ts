/** Thin local writer. Midan (public social) can reuse this name; inbox stays private DM. */

export type WriterIdentity = {
  name: string;
  guest: boolean;
};

export type SignedLike = {
  displayName?: string | null;
  isDevFallback?: boolean;
} | null;

export function writerName(profileName: string, lang: "ar" | "en" = "ar") {
  const trimmed = profileName.trim();
  if (trimmed) return trimmed;
  return lang === "ar" ? "أنا" : "Me";
}

/** Inbox / OS writer: local name, then a real signed-in account. */
export function osWriterName(profileName: string, signedName: string, lang: "ar" | "en" = "ar") {
  return writerName(profileName || signedName, lang);
}

export function signedDisplayName(user: SignedLike) {
  if (!user || user.isDevFallback) return "";
  return (user.displayName ?? "").trim();
}

/** Persist a signed-in name onto the device profile once — one thin account. */
export function seedProfileFromAccount(profileName: string, signedName: string) {
  if (profileName.trim()) return null;
  const signed = signedName.trim();
  return signed || null;
}

export function writerIdentity(profileName: string, guest: boolean, lang: "ar" | "en" = "ar"): WriterIdentity {
  return { name: writerName(profileName, lang), guest };
}

export function selfAuthors(profileName: string, signedName = "") {
  const names: string[] = [];
  const add = (value: string) => {
    const next = value.trim();
    if (next && !names.includes(next)) names.push(next);
  };
  add(profileName);
  add("أنا");
  add("Me");
  add(signedName);
  return names;
}

/** One name for the public Square writer: square profile, then OS name, then signed-in name. */
export function midanWriterName(squareName: string, profileName: string, signedName: string, lang: "ar" | "en" = "ar") {
  const name = (squareName || profileName || signedName).trim();
  if (name) return name;
  return lang === "ar" ? "ضيف الواحة" : "Oasis guest";
}
