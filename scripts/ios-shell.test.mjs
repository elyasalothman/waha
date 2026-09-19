import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { injectGrokPwaHead, isWebManifestPath, renderWebManifest } from "./grok-pwa-shared.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const exists = (rel) => existsSync(join(root, rel));

const FORBIDDEN_BUNDLES = [
  "com.alhajda.hissati",
  "com.alhajda.tahajjud",
  "com.alhajda.mohsen",
  "com.alhajda.tahdir",
];

/** Safe-area padding may live on `.native-safe-*` chrome only — never html/body. */
function htmlBodySafeAreaPaddingRules(source) {
  const withoutComments = String(source).replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors, body]) => {
      if (!/padding(-(top|right|bottom|left))?\s*:/.test(body)) return false;
      if (!/safe-area-inset/.test(body)) return false;
      return selectors.split(",").some((sel) => {
        const last = sel.trim().split(/\s+/).filter(Boolean).at(-1) ?? "";
        return /^(html|body)([.#:][\w-]+)*$/.test(last);
      });
    })
    .map(([, selectors]) => selectors.trim());
}

test("Capacitor config is واحة under alhajda, not a sibling app", () => {
  const source = read("capacitor.config.ts");
  assert.match(source, /appId:\s*"com\.alhajda\.waha"/);
  assert.match(source, /appName:\s*"واحة"/);
  assert.match(source, /webDir:\s*"www"/);
  assert.match(source, /contentInset:\s*"never"/);
  assert.match(source, /scheme:\s*"Waha"/);
  assert.match(source, /style:\s*"DARK"/);
  assert.match(source, /overlaysWebView:\s*true/);
  assert.match(source, /resize:\s*"native"/);
  assert.match(source, /LocalNotifications/);
  assert.match(source, /Browser/);
  assert.match(source, /WKWebView is the App Store app/);
  assert.match(source, /@capacitor\/browser/);
  assert.match(source, /PRODUCTION_HOST = "waha\.hajdah\.com"/);
  assert.doesNotMatch(source, /PRODUCTION_HOST = "waha\.alhajda\.com"/);
  for (const id of FORBIDDEN_BUNDLES) {
    assert.doesNotMatch(source, new RegExp(id.replace(/\./g, "\\.")));
  }
});

test("iOS webview is configured for edge-to-edge safe-area chrome", () => {
  const rootHead = read("src/routes/__root.tsx");
  const css = read("src/styles.css");
  const shell = read("src/components/layout/shell.tsx");
  const fallback = read("native/www-fallback/index.html");
  const fallbackCss = read("native/www-fallback/fallback.css");
  const controller = read("ios/App/App/WahaViewController.swift");

  assert.match(rootHead, /viewport-fit=cover/);
  assert.match(css, /html\.native-ios/);
  assert.match(css, /html\.standalone/);
  assert.match(css, /display-mode:\s*standalone/);
  assert.match(css, /\.native-safe-top/);
  assert.match(css, /\.native-safe-bottom/);
  assert.match(css, /env\(safe-area-inset-top/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.deepEqual(htmlBodySafeAreaPaddingRules(css), []);
  assert.match(css, /\.native-safe-top\s*\{[^}]*padding-top:\s*env\(safe-area-inset-top/);
  assert.match(css, /\.native-safe-bottom\s*\{[^}]*padding-bottom:\s*env\(safe-area-inset-bottom/);
  assert.match(shell, /native-safe-top/);
  assert.match(shell, /native-safe-bottom/);
  assert.match(shell, /safe-area-inset-bottom/);
  assert.match(shell, /safe-area-inset-top/);
  assert.match(fallback, /viewport-fit=cover/);
  assert.match(fallback, /black-translucent/);
  assert.deepEqual(htmlBodySafeAreaPaddingRules(fallbackCss), []);
  assert.match(fallbackCss, /\.native-safe-top\s*\{[^}]*padding-top:\s*env\(safe-area-inset-top/);
  assert.match(fallbackCss, /\.native-safe-bottom\s*\{[^}]*padding-bottom:\s*env\(safe-area-inset-bottom/);
  assert.match(controller, /preferredStatusBarStyle[\s\S]*\.lightContent/);
  assert.match(controller, /contentInsetAdjustmentBehavior = \.never/);
  assert.match(controller, /semanticContentAttribute = \.forceRightToLeft/);
});

test("Info.plist is Arabic-first واحة with light status bar and no sibling ids", () => {
  const plist = read("ios/App/App/Info.plist");
  const ar = read("ios/App/App/ar.lproj/InfoPlist.strings");
  const en = read("ios/App/App/en.lproj/InfoPlist.strings");

  assert.match(plist, /<key>CFBundleDevelopmentRegion<\/key>\s*<string>ar<\/string>/);
  assert.match(plist, /<key>CFBundleDisplayName<\/key>\s*<string>واحة<\/string>/);
  assert.match(plist, /UIStatusBarStyleLightContent/);
  assert.match(plist, /ITSAppUsesNonExemptEncryption/);
  assert.match(plist, /NSAppTransportSecurity/);
  assert.doesNotMatch(plist, /NSAllowsArbitraryLoads<\/key>\s*<true\/>/);
  assert.match(ar, /واحة/);
  assert.match(en, /Waha/);
  for (const id of FORBIDDEN_BUNDLES) {
    assert.doesNotMatch(plist, new RegExp(id.replace(/\./g, "\\.")));
  }
});

test("Xcode project uses com.alhajda.waha and house team", () => {
  const project = read("ios/App/App.xcodeproj/project.pbxproj");
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = com\.alhajda\.waha;/);
  assert.match(project, /DEVELOPMENT_TEAM = HQRPK78BRV;/);
  assert.match(project, /MARKETING_VERSION = 1\.0\.0;/);
  assert.match(project, /CURRENT_PROJECT_VERSION = 1;/);
  assert.match(project, /WahaViewController\.swift/);
  for (const id of FORBIDDEN_BUNDLES) {
    assert.doesNotMatch(project, new RegExp(id.replace(/\./g, "\\.")));
  }
});

test("Codemagic ios-release archives واحة for TestFlight, not App Store submit", () => {
  const yaml = read("codemagic.yaml");
  const trigger = read(".github/workflows/trigger-codemagic-ios.yml");
  const agv = read("scripts/ios-agvtool.sh");
  const bump = read("scripts/ios-next-build.sh");

  assert.match(yaml, /ios-release:/);
  assert.match(yaml, /bundle_identifier: com\.alhajda\.waha/);
  assert.match(yaml, /submit_to_testflight: true/);
  assert.doesNotMatch(yaml, /submit_to_app_store:\s*true/);
  assert.match(read("docs/TESTFLIGHT.md"), /لا Submit for Review/);
  assert.match(read("docs/RD-IOS.md"), /ليست غلافاً رقيقاً/);
  assert.match(yaml, /npx cap sync ios/);
  assert.match(yaml, /ios-next-build\.sh/);
  assert.match(trigger, /workflowId\\?":\\?"ios-release/);
  assert.match(agv, /-noscm/);
  assert.match(bump, /max\(CURRENT_PROJECT_VERSION, latest_uploaded\) \+ 1/);
});

test("sync-www produces www/ with native-ios boot and fallback splash", () => {
  execFileSync(process.execPath, [join(root, "scripts/sync-www.mjs")], { cwd: root, stdio: "pipe" });
  assert.ok(exists("www/index.html"));
  assert.ok(exists("www/native-ios.js"));
  const html = read("www/index.html");
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /native-ios\.js/);
  assert.match(html, /واحة/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /__grok/);
  assert.ok(exists("www/manifest.webmanifest"));
  assert.ok(exists("www/icon-180.png") || exists("www/icons/icon-180.png"));
  assert.deepEqual(htmlBodySafeAreaPaddingRules(read("www/fallback.css")), []);
});

test("PWA add-to-home-screen is واحة with a real manifest, not __grok", () => {
  const rootHead = read("src/routes/__root.tsx");
  const fallback = read("native/www-fallback/index.html");
  const manifest = JSON.parse(read("public/manifest.webmanifest"));

  assert.match(rootHead, /rel:\s*"manifest",\s*href:\s*"\/manifest\.webmanifest"/);
  assert.match(rootHead, /apple-touch-icon[\s\S]*\/icon-180\.png/);
  assert.match(rootHead, /const PWA_NAME = "واحة"/);
  assert.match(rootHead, /apple-mobile-web-app-title[\s\S]*PWA_NAME/);
  assert.match(rootHead, /apple-mobile-web-app-capable[\s\S]*yes/);
  assert.match(rootHead, /black-translucent/);
  assert.doesNotMatch(rootHead, /__grok/);
  assert.match(fallback, /apple-mobile-web-app-title" content="واحة"/);
  assert.match(fallback, /href="\/manifest\.webmanifest"/);
  assert.doesNotMatch(fallback, /__grok/);
  assert.equal(manifest.name, "واحة");
  assert.equal(manifest.short_name, "واحة");
  assert.equal(manifest.lang, "ar");
  assert.equal(manifest.dir, "rtl");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.theme_color, "#141311");
  assert.ok(exists("public/icons/icon-180.png"));
  assert.ok(exists("public/icons/icon-192.png"));
  assert.ok(exists("public/icons/icon-512.png"));

  const injected = injectGrokPwaHead(
    `<html><head>
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/icons/icon-180.png" />
      <meta name="apple-mobile-web-app-title" content="واحة" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="theme-color" content="#0c0d0c" />
    </head><body></body></html>`,
  );
  assert.match(injected, /href="\/manifest\.webmanifest"/);
  assert.match(injected, /apple-mobile-web-app-title" content="واحة"/);
  assert.match(injected, /black-translucent/);
  assert.doesNotMatch(injected, /__grok\/manifest/);
  assert.doesNotMatch(injected, /__grok\/icon-180/);

  assert.equal(isWebManifestPath("/manifest.webmanifest"), true);
  assert.equal(isWebManifestPath("/manifest.json"), true);
  assert.match(read("server/middleware/grok-pwa.ts"), /isWebManifestPath/);
  assert.match(read("scripts/grok-pwa-plugin.mjs"), /isWebManifestPath/);
  const served = JSON.parse(renderWebManifest("waha.hajdah.com"));
  assert.equal(served.name, "واحة");
  assert.ok(served.icons.some((icon) => icon.src === "/icons/icon-180.png"));
  assert.doesNotMatch(JSON.stringify(served), /__grok/);
});

test("Podfile ships Browser + LocalNotifications with native keyboard", () => {
  const podfile = read("ios/App/Podfile");
  const cap = read("capacitor.config.ts");
  assert.match(podfile, /CapacitorBrowser/);
  assert.match(podfile, /CapacitorLocalNotifications/);
  assert.match(podfile, /CapacitorKeyboard/);
  assert.match(podfile, /CapacitorStatusBar/);
  assert.match(cap, /Browser:\s*\{/);
  assert.match(cap, /resize:\s*"native"/);
});

test("Arabic RTL fields are wired and ASC Submit stays blocked", () => {
  const css = read("src/styles.css");
  const input = read("src/components/ui/input.tsx");
  const palette = read("src/components/command-palette.tsx");
  const salah = read("src/apps/life/salah.tsx");
  const yaml = read("codemagic.yaml");

  assert.match(css, /html\[dir="rtl"\] input/);
  assert.match(css, /unicode-bidi:\s*plaintext/);
  assert.match(input, /dir = "auto"/);
  assert.match(palette, /dir=\{lang === "ar" \? "rtl" : "ltr"\}/);
  assert.match(salah, /إشعار الصلاة القادمة/);
  assert.match(salah, /LocalNotifications|syncSalahNotification/);
  assert.match(read("src/components/layout/shell.tsx"), /DoorsStrip/);
  assert.match(read("src/components/doors-strip.tsx"), /ExternalLink/);
  assert.match(read("src/lib/native-browser.ts"), /@capacitor\/browser/);
  assert.match(read("src/lib/native-browser.ts"), /tahajjud\.alhajda\.com/);
  assert.doesNotMatch(yaml, /submit_to_app_store:\s*true/);
});

test("ios-next-build never decreases the project version", () => {
  const script = join(root, "scripts/ios-next-build.sh");
  const run = (...args) =>
    execFileSync("bash", [script, ...args], { encoding: "utf8" }).trim();
  assert.equal(run("18", "13"), "19");
  assert.equal(run("18", "20"), "21");
  assert.equal(run("1"), "1");
});
