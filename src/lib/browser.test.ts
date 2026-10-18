import { test } from "node:test";
import assert from "node:assert/strict";
import { browserUrl } from "./browser.ts";
test("browser allows HTTPS and rejects script, local files, insecure and credential URLs", () => {
  assert.equal(
    browserUrl("ar.wikipedia.org/wiki/واحة"),
    new URL("https://ar.wikipedia.org/wiki/واحة").href,
  );
  for (const input of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///tmp/a",
    "http://example.com",
    "https://user:pass@example.com",
    "",
  ])
    assert.throws(() => browserUrl(input));
});
