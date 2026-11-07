const PLACEHOLDER = /\(\s*مثال\s*\)/;

/** First authentic paragraph that can stand alone. Placeholder numbers stay in the book, not on the card. */
export function readingExcerpt(paragraphs: readonly string[]): { text: string; paragraph: number } | null {
  for (const [paragraph, value] of paragraphs.entries()) {
    const text = value.trim();
    if (text.length < 40 || PLACEHOLDER.test(text)) continue;
    return { text, paragraph };
  }
  return null;
}
