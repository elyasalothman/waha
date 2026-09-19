import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const exists = (rel) => existsSync(join(root, rel));

const FORBIDDEN_BUNDLES = [
  "com.alhajda.hissati",
  "com.alhajda.tahajjud",
  "com.alhajda.mohsen",
  "com.alhajda.tahdir",
];

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
  assert.match(source, /WKWebView is the App Store app/);
  assert.match(source, /waha\.alhajda\.com/);
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
  assert.match(css, /\.native-safe-top/);
  assert.match(css, /\.native-safe-bottom/);
  assert.match(css, /env\(safe-area-inset-top/);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(shell, /native-safe-top/);
  assert.match(shell, /native-safe-bottom/);
  assert.match(shell, /safe-area-inset-bottom/);
  assert.match(shell, /safe-area-inset-top/);
  assert.match(fallback, /viewport-fit=cover/);
  assert.match(fallbackCss, /env\(safe-area-inset-top/);
  assert.match(fallbackCss, /env\(safe-area-inset-bottom/);
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
