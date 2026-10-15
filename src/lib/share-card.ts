export const featureButton =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-surface-2";
export async function shareCard(title: string, text: string, url: string) {
  if (navigator.share) await navigator.share({ title, text, url });
  else if (navigator.clipboard) await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
  else throw new Error("unavailable");
}
