export function browserUrl(input: string): string {
  const url = new URL(
    /^[a-z][a-z\d+.-]*:/i.test(input.trim()) ? input.trim() : `https://${input.trim()}`,
  );
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes("."))
    throw new Error("Invalid URL");
  return url.href;
}
