export type RichBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isRule(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

/** Plain text, lists, and markdown tables. The model text is never inserted as HTML. */
export function richBlocks(text: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines.every((line) => line.startsWith("|")) && lines.length >= 2) {
      const header = cells(lines[0]);
      const body = lines.slice(isRule(lines[1]) ? 2 : 1).filter((line) => !isRule(line));
      blocks.push({
        type: "table",
        headers: header,
        rows: body.map(cells).filter((row) => row.some(Boolean)),
      });
      continue;
    }
    if (lines.every((line) => /^[-•]\s+/.test(line))) {
      blocks.push({ type: "list", items: lines.map((line) => line.replace(/^[-•]\s+/, "")) });
      continue;
    }
    blocks.push({ type: "p", text: lines.join("\n") });
  }
  return blocks;
}
