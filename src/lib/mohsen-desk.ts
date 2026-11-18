/** A small public-page desk. It does not log in, pay, or invent prices. */

export const DESK_DAILY_CAP = 5;
export const DESK_TEXT_CAP = 4000;

export function deskDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function deskAllowed(count: number, cap = DESK_DAILY_CAP): boolean {
  return Number.isInteger(count) && count >= 0 && count < cap;
}

const BLOCKED = /(login|signin|sign-in|account|checkout|payment|pay|cart|password|otp)/i;

export function publicPageUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (BLOCKED.test(url.pathname) || BLOCKED.test(url.hostname)) return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
    if (/^(10\.|127\.|0\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

export function htmlToText(html: string): { title: string; text: string } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const without = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const text = decode(without).replace(/\s+/g, " ").trim().slice(0, DESK_TEXT_CAP);
  return { title: decode(title).replace(/\s+/g, " ").trim().slice(0, 180), text };
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

export type PrintedPrice = { amount: string; unit: string; context: string };

/** Only prices printed on the page. Absence is reported, not filled in. */
export function printedPrices(text: string): PrintedPrice[] {
  const found: PrintedPrice[] = [];
  const pattern = /(\d[\d,.]{0,12})\s*(ريال|ر\.س|SAR|USD|\$)/gi;
  for (const match of text.matchAll(pattern)) {
    if (found.length >= 8) break;
    const start = Math.max(0, (match.index ?? 0) - 24);
    found.push({
      amount: match[1],
      unit: match[2],
      context: text.slice(start, (match.index ?? 0) + match[0].length + 24).trim(),
    });
  }
  return found;
}

export function excerpt(text: string, sentences = 3): string {
  const parts = text.split(/(?<=[.!?۔])\s+/).filter(Boolean).slice(0, sentences);
  return parts.join(" ").slice(0, 700);
}

export function pricesToCsv(pages: { url: string; title: string; prices: PrintedPrice[] }[]): string {
  const lines = ["الصفحة,العنوان,المبلغ,الوحدة,سياق مطبوع"];
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  for (const page of pages) {
    if (!page.prices.length) {
      lines.push([page.url, page.title, "", "", "لا سعر مطبوع"].map(cell).join(","));
      continue;
    }
    for (const price of page.prices) {
      lines.push([page.url, page.title, price.amount, price.unit, price.context].map(cell).join(","));
    }
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** ASCII PDF of links and printed figures. Arabic stays in the CSV. */
export function figuresPdf(pages: { url: string; title: string; prices: PrintedPrice[] }[]): string {
  const rows = ["Muhsin desk. Public pages only. No login and no payment.", ""];
  for (const page of pages) {
    rows.push(page.url);
    rows.push(page.prices.length ? page.prices.map((price) => `${price.amount} ${price.unit}`).join("; ") : "No printed price");
    rows.push("");
  }
  const text = rows.join("\n").replace(/[^\x20-\x7e\n]/g, "?");
  const stream = `BT /F1 11 Tf 40 780 Td (${text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)").replaceAll("\n", ") Tj T* (")}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}
