/** Thin local writer. Midan (public social) can reuse this name; inbox stays private DM. */

export type WriterIdentity = {
  name: string;
  guest: boolean;
};

export function writerName(profileName: string, lang: "ar" | "en" = "ar") {
  const trimmed = profileName.trim();
  if (trimmed) return trimmed;
  return lang === "ar" ? "أنا" : "Me";
}

export function writerIdentity(profileName: string, guest: boolean, lang: "ar" | "en" = "ar"): WriterIdentity {
  return { name: writerName(profileName, lang), guest };
}

export function selfAuthors(profileName: string) {
  const trimmed = profileName.trim();
  return trimmed ? [trimmed, "أنا", "Me"] : ["أنا", "Me"];
}

/** One name for the public Square writer: square profile, then OS name, then signed-in name. */
export function midanWriterName(squareName: string, profileName: string, signedName: string, lang: "ar" | "en" = "ar") {
  const name = (squareName || profileName || signedName).trim();
  if (name) return name;
  return lang === "ar" ? "ضيف الواحة" : "Oasis guest";
}
