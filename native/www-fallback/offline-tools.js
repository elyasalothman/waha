// Bundled tools use their own store; they never overwrite online reading or game progress.
const status = document.querySelector("#save-status");
const notes = document.querySelector("#notes");
const checks = [...document.querySelectorAll("input[type=checkbox]")];
const key = "waha:ios:offline-tools:v1";
try {
  const saved = JSON.parse(localStorage.getItem(key) || "{}");
  notes.value = typeof saved.notes === "string" ? saved.notes : "";
  if (saved.day === new Date().toLocaleDateString("en-CA")) {
    checks.forEach((input) => {
      input.checked = saved.done?.includes(input.id) === true;
    });
  }
} catch {
  status.textContent = "تعذّر استعادة الحفظ المحلي.";
}
function save() {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        notes: notes.value,
        day: new Date().toLocaleDateString("en-CA"),
        done: checks.filter((input) => input.checked).map((input) => input.id),
      }),
    );
    status.textContent = "محفوظ على هذا الجهاز";
  } catch {
    status.textContent = "تعذّر الحفظ؛ انسخ ملاحظتك قبل الإغلاق.";
  }
}
notes.addEventListener("input", save);
checks.forEach((input) => input.addEventListener("change", save));
let count = 0;
document.querySelector("#count").addEventListener("click", (event) => {
  count += 1;
  event.currentTarget.textContent = `تسبيح: ${count}`;
});
document.querySelector("#reset-count").addEventListener("click", () => {
  count = 0;
  document.querySelector("#count").textContent = "تسبيح: 0";
});
