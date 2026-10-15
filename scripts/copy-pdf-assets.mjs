import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Self-host parser support files. No PDF data or remote CDN is involved.
export function copyPdfAssets() {
  const target = resolve("public/pdfjs");
  mkdirSync(target, { recursive: true });
  for (const name of ["cmaps", "standard_fonts", "wasm", "LICENSE"]) {
    cpSync(resolve("node_modules/pdfjs-dist", name), resolve(target, name), { recursive: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) copyPdfAssets();
