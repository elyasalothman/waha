const ONES = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const TEENS = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const TENS = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const HUNDREDS = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

function join(parts: string[]) {
  return parts.filter(Boolean).join(" و");
}

function underHundred(n: number): string {
  if (n <= 0) return "";
  if (n < 10) return ONES[n] ?? "";
  if (n < 20) return TEENS[n - 10] ?? "";
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${ONES[o]} و${TENS[t]}` : TENS[t] ?? "";
}

function underThousand(n: number): string {
  if (n <= 0) return "";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return join([HUNDREDS[h] ?? "", underHundred(rest)]);
}

function scaleWord(n: number, one: string, two: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${underThousand(n)} ${many}`;
  return `${underThousand(n)} ${one}`;
}

export function tafqeetInteger(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "صفر";
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (billions) parts.push(scaleWord(billions, "مليار", "ملياران", "مليارات"));
  if (millions) parts.push(scaleWord(millions, "مليون", "مليونان", "ملايين"));
  if (thousands) parts.push(scaleWord(thousands, "ألف", "ألفان", "آلاف"));
  if (rest) parts.push(underThousand(rest));
  return join(parts);
}

function riyalWord(n: number) {
  if (n === 0) return "";
  if (n === 1) return "ريال واحد";
  if (n === 2) return "ريالان";
  if (n >= 3 && n <= 10) return `${tafqeetInteger(n)} ريالات`;
  if (n >= 11 && n <= 99) return `${tafqeetInteger(n)} ريالاً`;
  return `${tafqeetInteger(n)} ريال`;
}

function halalaWord(n: number) {
  if (n === 0) return "";
  if (n === 1) return "هللة واحدة";
  if (n === 2) return "هللتان";
  if (n >= 3 && n <= 10) return `${tafqeetInteger(n)} هللات`;
  return `${tafqeetInteger(n)} هللة`;
}

export function tafqeetMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  const sign = amount < 0 ? "سالب " : "";
  const cents = Math.round(Math.abs(amount) * 100);
  const riyals = Math.floor(cents / 100);
  const halalas = cents % 100;
  const r = riyalWord(riyals);
  const h = halalaWord(halalas);
  if (!r && !h) return "صفر ريال";
  if (r && h) return `${sign}${r} و${h}`;
  if (r) return `${sign}${r} سعودي`;
  return `${sign}${h}`;
}
