import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { weightedScore } from "@/lib/decision";
export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "قرارك · مقارنة الخيارات داخل واحة" },
      { name: "description", content: "قارن خيارين بأوزان ومعايير تختارها داخل واحة." },
    ],
  }),
  component: Compare,
});
function Compare() {
  const [names, setNames] = useState(["الخيار الأول", "الخيار الثاني"]);
  const [criteria, setCriteria] = useState([
    { name: "التكلفة", weight: 3, scores: [5, 5] },
    { name: "الجودة", weight: 2, scores: [5, 5] },
    { name: "الوقت", weight: 1, scores: [5, 5] },
  ]);
  const scores = names.map((_, i) =>
    weightedScore(
      criteria.map((c) => c.scores[i]),
      criteria.map((c) => c.weight),
    ),
  );
  const input = "min-h-11 w-full min-w-0 rounded-lg border border-border bg-surface p-2";
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-3xl">قرارك · قارن خياراتك</h1>
      <p className="leading-7 text-muted">
        سمِّ خيارين، وحدد أهمية كل معيار ثم امنح كل خيار درجة من ٠ إلى ١٠ (الأعلى أفضل). الحساب
        محلي؛ يساعدك على ترتيب أفكارك.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {names.map((name, i) => (
          <label key={i}>
            اسم الخيار {i + 1}
            <input
              className={input}
              value={name}
              maxLength={80}
              onChange={(e) => setNames(names.map((n, j) => (i === j ? e.target.value : n)))}
            />
          </label>
        ))}
      </div>
      {criteria.map((c, i) => (
        <fieldset key={i} className="space-y-3 rounded-xl border border-border p-3">
          <legend>المعيار {i + 1}</legend>
          <label className="block">
            اسم المعيار
            <input
              className={input}
              value={c.name}
              maxLength={80}
              onChange={(e) =>
                setCriteria(criteria.map((x, j) => (i === j ? { ...x, name: e.target.value } : x)))
              }
            />
          </label>
          <label className="block">
            الأهمية (٠–٥)
            <input
              className={input}
              type="number"
              min="0"
              max="5"
              value={c.weight}
              onChange={(e) =>
                setCriteria(
                  criteria.map((x, j) =>
                    i === j
                      ? { ...x, weight: Math.min(5, Math.max(0, Number(e.target.value))) }
                      : x,
                  ),
                )
              }
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {names.map((name, k) => (
              <label key={k}>
                درجة {name}
                <input
                  className={input}
                  type="number"
                  min="0"
                  max="10"
                  value={c.scores[k]}
                  onChange={(e) =>
                    setCriteria(
                      criteria.map((x, j) =>
                        i === j
                          ? {
                              ...x,
                              scores: x.scores.map((s, l) =>
                                l === k ? Math.min(10, Math.max(0, Number(e.target.value))) : s,
                              ),
                            }
                          : x,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div role="status" className="rounded-xl bg-primary/10 p-4">
        {names.map((name, i) => (
          <p key={i}>
            {name}: <output data-comparison-score>{scores[i].toFixed(2)}</output> / 10
          </p>
        ))}
        <p>
          {criteria.every((c) => !c.weight)
            ? "أضف وزنًا لمعيار واحد على الأقل."
            : scores[0] === scores[1]
              ? "الخياران متعادلان حسب معاييرك."
              : `الأعلى حسب معاييرك: ${names[scores[0] > scores[1] ? 0 : 1]}`}
        </p>
      </div>
    </div>
  );
}
