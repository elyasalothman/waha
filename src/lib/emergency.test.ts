import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FAMILY_EMERGENCY_DIGITS, FAMILY_EMERGENCY_NUMBERS, emergencyTel } from "./emergency.ts";

describe("family emergency strip", () => {
  it("is only the four official Saudi numbers with verified labels", () => {
    assert.deepEqual(FAMILY_EMERGENCY_DIGITS, ["911", "997", "998", "937"]);
    assert.equal(FAMILY_EMERGENCY_NUMBERS[0]?.ar, "الطوارئ الموحد");
    assert.equal(FAMILY_EMERGENCY_NUMBERS[1]?.ar, "الهلال الأحمر");
    assert.equal(FAMILY_EMERGENCY_NUMBERS[2]?.ar, "الدفاع المدني");
    assert.equal(FAMILY_EMERGENCY_NUMBERS[3]?.ar, "صحة ٩٣٧");
    assert.equal(emergencyTel("911"), "tel:911");
    assert.equal(
      FAMILY_EMERGENCY_NUMBERS.some((row) => ["999", "993", "933"].includes(row.n)),
      false,
    );
  });
});
