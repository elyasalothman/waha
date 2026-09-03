const BANKS: Record<string, { ar: string; en: string }> = {
  "10": { ar: "البنك الأهلي السعودي", en: "Saudi National Bank" },
  "20": { ar: "بنك الرياض", en: "Riyad Bank" },
  "30": { ar: "البنك العربي الوطني", en: "Arab National Bank" },
  "40": { ar: "البنك السعودي الفرنسي", en: "Banque Saudi Fransi" },
  "45": { ar: "ساب", en: "SABB" },
  "50": { ar: "بنك الجزيرة", en: "Bank AlJazira" },
  "55": { ar: "بنك الاستثمار", en: "SAIB" },
  "60": { ar: "بنك البلاد", en: "Bank Albilad" },
  "80": { ar: "مصرف الراجحي", en: "Al Rajhi Bank" },
  "83": { ar: "بنك الخليج الدولي", en: "GIB" },
  "85": { ar: "بنك الإمارات دبي الوطني", en: "Emirates NBD" },
  "90": { ar: "بنك البحرين الوطني", en: "NBB" },
  "95": { ar: "مصرف الإنماء", en: "Alinma Bank" },
};

function lettersToDigits(s: string) {
  return s
    .split("")
    .map((ch) => {
      const c = ch.toUpperCase();
      if (c >= "A" && c <= "Z") return String(c.charCodeAt(0) - 55);
      return c;
    })
    .join("");
}

function mod97(digits: string) {
  let rest = 0;
  for (const ch of digits) {
    rest = (rest * 10 + Number(ch)) % 97;
  }
  return rest;
}

export function normalizeIban(raw: string) {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

export function formatIban(raw: string) {
  const n = normalizeIban(raw);
  return n.replace(/(.{4})/g, "$1 ").trim();
}

export function checkIban(raw: string): {
  ok: boolean;
  reasonAr: string;
  reasonEn: string;
  bank?: { ar: string; en: string };
  formatted: string;
} {
  const iban = normalizeIban(raw);
  const formatted = formatIban(iban);
  if (!iban) {
    return { ok: false, reasonAr: "أدخل الآيبان", reasonEn: "Enter an IBAN", formatted };
  }
  if (!iban.startsWith("SA")) {
    return { ok: false, reasonAr: "الآيبان السعودي يبدأ بـ SA", reasonEn: "A Saudi IBAN starts with SA", formatted };
  }
  if (iban.length !== 24) {
    return {
      ok: false,
      reasonAr: `الطول ${iban.length} — الصحيح ٢٤ خانة`,
      reasonEn: `Length ${iban.length} — should be 24`,
      formatted,
    };
  }
  if (!/^SA\d{22}$/.test(iban)) {
    return { ok: false, reasonAr: "صيغة غير صحيحة", reasonEn: "Invalid format", formatted };
  }
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = lettersToDigits(rearranged);
  const ok = mod97(digits) === 1;
  const bank = BANKS[iban.slice(4, 6)];
  if (!ok) {
    return { ok: false, reasonAr: "رقم التحقق لا يطابق", reasonEn: "Checksum failed", formatted, bank };
  }
  return { ok: true, reasonAr: "آيبان صحيح", reasonEn: "Valid IBAN", formatted, bank };
}
