/**
 * waha://app/budget#sms=… → /app/budget#sms=…
 * Only same-app paths are allowed; anything else is ignored.
 */
export function deepLinkPath(url: string): string | null {
  const match = /^waha:\/\/\/?(.*)$/i.exec((url ?? "").trim());
  if (!match) return null;
  const rest = match[1];
  if (!rest || /^[/\\]/.test(rest) || /^[a-z][a-z0-9+.-]*:/i.test(rest)) return rest ? null : "/";
  const path = `/${rest}`;
  if (!/^\/(?:app|money|me|more|life|services)(?:[/?#]|$)/.test(path)) return null;
  return path.slice(0, 8000);
}
