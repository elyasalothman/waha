import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("Android applicationId is com.alhajda.waha at the iOS marketing version", () => {
  const gradle = read("android/app/build.gradle");
  const activity = read("android/app/src/main/java/com/alhajda/waha/MainActivity.java");
  const strings = read("android/app/src/main/res/values/strings.xml");
  const instrumented = read(
    "android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java",
  );
  const pkg = JSON.parse(read("package.json"));

  assert.match(gradle, /namespace "com\.alhajda\.waha"/);
  assert.match(gradle, /applicationId "com\.alhajda\.waha"/);
  assert.match(gradle, /versionCode 1\b/);
  assert.match(gradle, /versionName "1\.2\.1"/);
  assert.match(activity, /package com\.alhajda\.waha;/);
  assert.match(strings, /<string name="package_name">com\.alhajda\.waha<\/string>/);
  assert.match(strings, /<string name="app_name">واحة<\/string>/);
  assert.match(instrumented, /assertEquals\("com\.alhajda\.waha"/);
  assert.equal(pkg.dependencies["@capacitor/android"], "^7.6.9");
  assert.match(pkg.scripts["cap:sync:android"], /npx cap sync android/);
  assert.match(read("capacitor.config.ts"), /appId:\s*"com\.alhajda\.waha"/);
  assert.doesNotMatch(gradle, /storePassword\s+["'][^"']+["']/);
  assert.doesNotMatch(gradle, /keyPassword\s+["'][^"']+["']/);
});

test("Codemagic android-aab skeleton stays commented so it cannot start a build", () => {
  const yaml = read("codemagic.yaml");
  const lines = yaml.split("\n");
  const active = lines.filter((line) => !/^\s*#/.test(line)).join("\n");
  const workflowKeys = lines.filter((line) => /^  [A-Za-z0-9_-]+:/.test(line));

  assert.deepEqual(workflowKeys, ["  ios-release:"]);
  assert.match(active, /ios-release:/);
  assert.doesNotMatch(active, /android-aab:/);
  assert.doesNotMatch(active, /bundleRelease/);
  assert.doesNotMatch(yaml, /submit_to_app_store:\s*true/);
  assert.equal(lines.filter((line) => /^\s*#.*android-aab:/.test(line)).length, 1);
});

test("keystore files are ignored and none are tracked", () => {
  const gitignore = read(".gitignore");
  const androidIgnore = read("android/.gitignore");
  assert.match(gitignore, /^\*\.jks$/m);
  assert.match(gitignore, /^\*\.keystore$/m);
  assert.match(gitignore, /^keystore\.properties$/m);
  assert.match(androidIgnore, /^\*\.jks$/m);
  assert.match(androidIgnore, /^\*\.keystore$/m);
  assert.match(androidIgnore, /^keystore\.properties$/m);
  assert.doesNotMatch(androidIgnore, /^#\*\.jks$/m);

  const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" });
  assert.doesNotMatch(tracked, /\.(jks|keystore|p12|pfx)$/m);
  assert.doesNotMatch(tracked, /(^|\/)keystore\.properties$/m);
  assert.doesNotMatch(tracked, /google-services\.json$/m);

  const onDisk = execFileSync(
    "find",
    [
      ".",
      "-path",
      "./node_modules",
      "-prune",
      "-o",
      "-path",
      "./.git",
      "-prune",
      "-o",
      "-type",
      "f",
      "(",
      "-name",
      "*.jks",
      "-o",
      "-name",
      "*.keystore",
      "-o",
      "-name",
      "keystore.properties",
      "-o",
      "-name",
      "*.p12",
      "-o",
      "-name",
      "*.pfx",
      ")",
      "-print",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(onDisk.trim(), "");
});

test("Android shell targets current Play API, keeps permissions minimal, and handles house doors", () => {
  const vars = read("android/variables.gradle");
  const manifest = read("android/app/src/main/AndroidManifest.xml");
  const activity = read("android/app/src/main/java/com/alhajda/waha/MainActivity.java");
  const door = read("android/app/src/main/java/com/alhajda/waha/HouseDoorBrowserPlugin.java");
  const icon = read("android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml");

  assert.match(vars, /compileSdkVersion = 36/);
  assert.match(vars, /targetSdkVersion = 36/);
  const perms = [...manifest.matchAll(/uses-permission android:name="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(perms.sort(), [
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.INTERNET",
  ]);
  assert.doesNotMatch(manifest, /ACCESS_FINE_LOCATION|CAMERA|RECORD_AUDIO|READ_CONTACTS|SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM/);
  // House doors: the web app calls HouseDoorBrowser.open on every native platform.
  assert.match(door, /@CapacitorPlugin\(name = "HouseDoorBrowser"\)/);
  assert.match(door, /"https"\.equalsIgnoreCase/);
  assert.match(activity, /registerPlugin\(HouseDoorBrowserPlugin\.class\);\s*super\.onCreate/);
  // Edge-to-edge (targetSdk 35+): keep the WebView clear of bars, cutout and keyboard.
  assert.match(activity, /WindowInsetsCompat\.Type\.ime\(\)/);
  assert.match(icon, /<monochrome /);
});

test("iOS shell is untouched by the Android platform", () => {
  const config = read("capacitor.config.ts");
  assert.match(config, /appId:\s*"com\.alhajda\.waha"/);
  assert.match(config, /contentInset: "never"/);
  const plugin = read("ios/App/App/HouseDoorBrowserPlugin.swift");
  assert.match(plugin, /jsName = "HouseDoorBrowser"/);
});
