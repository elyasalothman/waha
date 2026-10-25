import { parseIntent, normalize } from "./intents.ts";
import { registry, validateCommand, requiresConfirmation, type AgentCommand } from "./registry.ts";
export type StepStatus = "pending" | "running" | "done" | "failed" | "confirmation";
export type PlanStep = {
  id: string;
  command: AgentCommand;
  description: string;
  status: StepStatus;
  result?: unknown;
  error?: string;
};
export type Plan = {
  id: string;
  text: string;
  steps: PlanStep[];
  confidence: number;
  suggestions: string[];
};
export type PlanContext = { city?: string; now?: Date };
/** Only split before an explicit command verb; a book title and arithmetic stay intact. */
export function splitCommands(text: string): string[] {
  const commands: string[] = [];
  let start = 0;
  // Normalize only the look-ahead so names, note text and diacritics remain intact.
  const commandStart =
    /^(?:افتح|احسب|حل|ذكرني|تذكر|اضف|اكتب|سجل|اسال|ابحث|دور|غير|اعرض|انس|انسى|كمل|تابع|شغل|ودني|وديني|خذني|وش|كيف|كم|حول|خصم|العب)\s/;
  for (const match of text.matchAll(/\s+(?:ثم|بعدين|وبعدين|وبعدها|وبعد كذا)\s+|\s+و/g)) {
    const next = match.index + match[0].length;
    if (!commandStart.test(normalize(text.slice(next)))) continue;
    commands.push(text.slice(start, match.index).trim());
    start = next;
  }
  commands.push(text.slice(start).trim());
  return commands.filter(Boolean).slice(0, 12);
}
export function plan(text: string, ctx: PlanContext = {}): Plan {
  const chunks = splitCommands(text);
  const steps: PlanStep[] = [];
  let understood = 0;
  for (const [i, chunk] of chunks.entries()) {
    let command: AgentCommand | null = null;
    try {
      command = parseIntent(chunk);
    } catch {
      /* invalid local intent is clarification */
    }
    if (command) understood++;
    else if (/^(ما|ماذا|من|لماذا|كيف|هل|اشرح|وش معنى|وش هو|وش هي)\s/.test(normalize(chunk)))
      command = { tool: "ask_mohsen", args: { q: chunk } };
    if (!command) continue;
    if (command.tool === "weather" && !command.args.city && ctx.city)
      command = { tool: "weather", args: { city: ctx.city } };
    steps.push({
      id: `step-${i + 1}`,
      command,
      description: `${registry[command.tool].description}${Object.values(command.args).length ? ": " + Object.values(command.args).join("، ") : ""}`,
      status: "pending",
    });
  }
  const confidence =
    chunks.length && steps.length === chunks.length
      ? understood === chunks.length
        ? 1
        : 0.8
      : 0.25;
  return {
    id: `plan-${Date.now()}`,
    text,
    steps,
    confidence,
    suggestions:
      confidence < 0.5 ? ["افتح الحاسبة", "ابحث عن خدمة", `اسأل محسن ${text.slice(0, 450)}`] : [],
  };
}
export type AgentHost = {
  execute(command: AgentCommand): Promise<unknown>;
  navigate?(href: string): Promise<unknown>;
  openExternal?(url: string): Promise<unknown>;
  storage?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
  notify?(text: string): Promise<unknown>;
  fetch?: (url: string, init?: { method?: string; body?: string }) => Promise<unknown>;
};
/** Host never receives later steps before the preceding step completes and is confirmed. */
export async function executePlan(
  input: Plan,
  host: AgentHost,
  options: { confirmedStepIds?: string[]; onStep?: (step: PlanStep) => void } = {},
): Promise<Plan> {
  const output: Plan = { ...input, steps: input.steps.map((s) => ({ ...s })) };
  if (output.confidence < 0.5) return output;
  for (const step of output.steps) {
    if (step.status === "done") continue;
    const command = validateCommand(step.command);
    if (requiresConfirmation(command) && !options.confirmedStepIds?.includes(step.id)) {
      step.status = "confirmation";
      options.onStep?.(step);
      break;
    }
    step.status = "running";
    options.onStep?.(step);
    try {
      step.result = await host.execute(command);
      step.status = "done";
    } catch (error) {
      step.status = "failed";
      step.error = error instanceof Error ? error.message : "تعذر التنفيذ";
    }
    options.onStep?.(step);
    if (step.status === "failed") break;
  }
  return output;
}
