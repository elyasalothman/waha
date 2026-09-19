#!/usr/bin/env node
/**
 * Copy a Capacitor-ready web snapshot into www/.
 *
 * Prefers a Vite / TanStack Start client build (dist, .output/public,
 * .vercel/output/static). Falls back to native/www-fallback so `cap add`
 * and Codemagic still have an index.html before the live site exists.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WWW = join(ROOT, "www");
const FALLBACK = join(ROOT, "native", "www-fallback");

const CANDIDATES = [
  join(ROOT, "dist", "client"),
  join(ROOT, "dist"),
  join(ROOT, ".output", "public"),
  join(ROOT, ".vercel", "output", "static"),
];

function hasIndex(dir) {
  return existsSync(join(dir, "index.html"));
}

function pickSource() {
  for (const dir of CANDIDATES) {
    if (hasIndex(dir)) return dir;
  }
  return FALLBACK;
}

function stampNativeIos(html) {
  let next = html;
  if (!/viewport-fit=cover/.test(next)) {
    next = next.replace(
      /(<meta\s+name=["']viewport["']\s+content=["'])([^"']+)(["'])/i,
      (_, a, content, c) => {
        const bits = content
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (!bits.includes("viewport-fit=cover")) bits.push("viewport-fit=cover");
        return `${a}${bits.join(", ")}${c}`;
      },
    );
  }
  if (!/native-ios\.js/.test(next)) {
    next = next.replace("</head>", '  <script src="/native-ios.js" defer></script>\n  </head>');
  }
  if (!/apple-mobile-web-app-title/.test(next)) {
    next = next.replace(
      "</head>",
      '  <meta name="apple-mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-title" content="واحة" />\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n  </head>',
    );
  }
  if (!/rel=["']manifest["']/.test(next) || /__grok\/manifest/.test(next)) {
    next = next.replace(/<link[^>]+rel=["']manifest["'][^>]*>/i, "");
    next = next.replace("</head>", '  <link rel="manifest" href="/manifest.webmanifest" />\n  </head>');
  }
  if (!/apple-touch-icon/.test(next) || /__grok\/icon-180/.test(next)) {
    next = next.replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/i, "");
    next = next.replace("</head>", '  <link rel="apple-touch-icon" href="/icon-180.png" />\n  </head>');
  }
  return next;
}

const source = pickSource();
if (!hasIndex(source)) {
  console.error(`[sync-www] no index.html in ${source}`);
  process.exit(1);
}

rmSync(WWW, { recursive: true, force: true });
mkdirSync(WWW, { recursive: true });
cpSync(source, WWW, { recursive: true });

const nativeJs = join(ROOT, "native", "www-fallback", "native-ios.js");
if (existsSync(nativeJs)) {
  cpSync(nativeJs, join(WWW, "native-ios.js"));
}

const publicDir = join(ROOT, "public");
for (const name of ["manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"]) {
  const fromPublic = join(publicDir, name);
  const fromFallback = join(FALLBACK, name);
  const src = existsSync(fromPublic) ? fromPublic : fromFallback;
  if (existsSync(src)) cpSync(src, join(WWW, name));
}

const indexPath = join(WWW, "index.html");
writeFileSync(indexPath, stampNativeIos(readFileSync(indexPath, "utf8")));

console.log(`[sync-www] ${source} → www/`);
