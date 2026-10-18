import { cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Self-host pdf.js support files so the app renders PDFs fully offline.
const target = resolve("public/pdfjs");
mkdirSync(target, { recursive: true });
for (const name of ["cmaps", "standard_fonts", "wasm", "LICENSE"]) {
  cpSync(resolve("node_modules/pdfjs-dist", name), resolve(target, name), { recursive: true });
}
console.log("pdf.js assets copied to public/pdfjs");
