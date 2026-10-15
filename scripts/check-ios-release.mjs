import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

export function verifyIosRelease(project, availability) {
  assert.equal(
    (project.match(/MARKETING_VERSION = 1\.1\.0;/g) || []).length,
    2,
    "Both configurations must be 1.1.0",
  );
  assert.equal(
    (project.match(/IPHONEOS_DEPLOYMENT_TARGET = 17\.0;/g) || []).length,
    4,
    "iOS 17 required",
  );
  if (availability.email || availability.google) {
    assert.equal(availability.deleteAccount, true, "Active accounts require deletion support");
  }
  assert.equal(typeof availability.email, "boolean", "Capabilities must be explicit");
  assert.equal(typeof availability.google, "boolean", "Capabilities must be explicit");
}
if (process.argv[1]?.endsWith("/check-ios-release.mjs")) {
  const response = await fetch("https://waha.hajdah.com/api/auth-status", {
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  assert.equal(response.ok, true, "Production availability must be readable");
  verifyIosRelease(
    readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8"),
    await response.json(),
  );
  console.log("iOS 1.1.0 release source and production account gate passed");
}
