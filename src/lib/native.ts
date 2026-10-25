// Desktop bridge: native open/save dialogs via Tauri 2 plugins, with a browser
// fallback so `npm run dev` in a normal browser still works.
export const isTauri = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in (window as object);

export type Filter = { name: string; extensions: string[] };

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  json: "application/json",
};
export const mimeFor = (name: string) =>
  MIME[name.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
const baseName = (p: string) => p.split(/[\\/]/).pop() || p;

/** Native multi-file picker. Returns [] when cancelled. */
export async function openFiles(filters: Filter[], multiple = true): Promise<File[]> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const { readFile } = await import("@tauri-apps/plugin-fs");
  const picked = await open({ multiple, directory: false, filters });
  if (!picked) return [];
  const paths = Array.isArray(picked) ? picked : [picked];
  const out: File[] = [];
  for (const path of paths) {
    const bytes = await readFile(path);
    const name = baseName(path);
    out.push(new File([bytes], name, { type: mimeFor(name) }));
  }
  return out;
}

/** Native "Save as" dialog. Returns the saved path, or null if cancelled. */
export async function saveNative(blob: Blob, suggested: string, exclusive = false): Promise<string | null> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  const ext = suggested.split(".").pop() ?? "";
  const path = await save({
    defaultPath: suggested,
    filters: ext ? [{ name: ext.toUpperCase(), extensions: [ext] }] : undefined,
  });
  if (!path) return null;
  if (exclusive) {
    const { open } = await import("@tauri-apps/plugin-fs");
    const file = await open(path, { write: true, createNew: true });
    try { await file.write(new Uint8Array(await blob.arrayBuffer())); } finally { await file.close(); }
  } else await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
  return path;
}

export async function askConfirm(message: string): Promise<boolean> {
  if (!isTauri()) return confirm(message);
  const { ask } = await import("@tauri-apps/plugin-dialog");
  return ask(message, { title: "واحة للكمبيوتر", kind: "warning", okLabel: "نعم", cancelLabel: "إلغاء" });
}
