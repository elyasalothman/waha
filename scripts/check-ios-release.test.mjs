import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifyIosRelease } from "./check-ios-release.mjs";
const project = readFileSync(
  new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url),
  "utf8",
);
test("release permits disabled accounts and rejects missing/enabled capabilities or stale versions", () => {
  assert.doesNotThrow(() => verifyIosRelease(project, { email: false, google: false }));
  assert.doesNotThrow(() =>
    verifyIosRelease(project, { email: true, google: false, deleteAccount: true }),
  );
  for (const flags of [{}, { email: true, google: false }, { email: false, google: true }]) {
    assert.throws(() => verifyIosRelease(project, flags));
  }
  assert.throws(() =>
    verifyIosRelease(project.replaceAll("1.2.0", "1.0.0"), { email: false, google: false }),
  );
});
