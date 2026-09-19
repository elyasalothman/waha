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
