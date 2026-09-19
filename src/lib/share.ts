export type SharePayload = {
  title?: string;
  text: string;
  url?: string;
};

export type ShareResult = "shared" | "copied" | "failed";

type ShareApi = {
  share?: (data: SharePayload) => Promise<void>;
  canShare?: (data: SharePayload) => boolean;
};

type ClipboardApi = {
  writeText?: (value: string) => Promise<void>;
};

export function composeShareText(payload: SharePayload): string {
  const parts = [payload.title, payload.text, payload.url].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  return parts.join("\n");
}

function canUseWebShare(share: ShareApi | undefined, payload: SharePayload): boolean {
  if (!share?.share) return false;
  if (typeof share.canShare !== "function") return true;
  try {
    return share.canShare(payload);
  } catch {
    return true;
  }
}

/**
 * Prefer the Web Share sheet; fall back to the clipboard.
 * Callers pass navigator so tests stay free of jsdom.
 */
export async function shareOrCopy(
  payload: SharePayload,
  apis: { share?: ShareApi; clipboard?: ClipboardApi } = {},
): Promise<ShareResult> {
  const text = composeShareText(payload);
  if (!text) return "failed";

  if (canUseWebShare(apis.share, payload)) {
    try {
      await apis.share!.share!(payload);
      return "shared";
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "AbortError") return "failed";
    }
  }

  if (apis.clipboard?.writeText) {
    try {
      await apis.clipboard.writeText(text);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}

export function browserShareApis(): { share?: ShareApi; clipboard?: ClipboardApi } {
  if (typeof navigator === "undefined") return {};
  return {
    share: navigator,
    clipboard: navigator.clipboard,
  };
}
