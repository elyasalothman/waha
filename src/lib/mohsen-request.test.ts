import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mohsenHistory, MOHSEN_BODY_LIMIT, MOHSEN_MESSAGE_LIMIT } from "./mohsen-request.ts";
test("ordinary Arabic conversations fit the request budget without rejecting the next question", () => {
  const messages = Array.from({ length: 8 }, (_, i) => ({
    role: i % 2 ? "assistant" : "user",
    content: "ع".repeat(3000),
  }));
  assert.ok(
    JSON.stringify({ message: "ع".repeat(MOHSEN_MESSAGE_LIMIT), messages }).length <
      MOHSEN_BODY_LIMIT,
  );
  const history = mohsenHistory(messages);
  assert.equal(
    history.reduce((n, m) => n + m.content.length, 0),
    12000,
  );
  assert.equal(history.at(-1)?.role, "assistant");
});
test("history rejects malformed roles and preserves recent context", () => {
  assert.deepEqual(
    mohsenHistory([
      null,
      { role: "system", content: "secret" },
      { role: "user", content: 9 },
      { role: "user", content: "سؤال" },
    ]),
    [{ role: "user", content: "سؤال" }],
  );
  assert.deepEqual(mohsenHistory(null), []);
});
