/** A bounded arithmetic parser; no JavaScript execution. Trigonometry uses degrees. */
export function calculate(input: string): number {
  const source = input
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replaceAll("٫", ".")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-")
    .replaceAll("π", "pi")
    .replaceAll("√", "sqrt")
    .replace(/\s/g, "");
  if (!source || source.length > 500) throw new Error("Invalid expression");
  const tokens = source.match(/\d*\.?\d+(?:e[+-]?\d+)?|[a-z]+|[()+*/^%\-]/g) ?? [];
  if (tokens.join("") !== source) throw new Error("Invalid token");
  let pos = 0;
  const functions: Record<string, (x: number) => number> = {
    sin: (x) => Math.sin((x * Math.PI) / 180),
    cos: (x) => Math.cos((x * Math.PI) / 180),
    tan: (x) => Math.tan((x * Math.PI) / 180),
    sqrt: Math.sqrt,
    ln: Math.log,
    log: Math.log10,
  };
  function atom(): number {
    const t = tokens[pos++];
    let value: number;
    if (t === "(") {
      value = sum();
      if (tokens[pos++] !== ")") throw new Error("Missing parenthesis");
    } else if (t === "pi") value = Math.PI;
    else if (t === "e") value = Math.E;
    else if (t && Object.hasOwn(functions, t)) {
      if (tokens[pos++] !== "(") throw new Error("Missing parenthesis");
      value = functions[t](sum());
      if (tokens[pos++] !== ")") throw new Error("Missing parenthesis");
    } else {
      value = Number(t);
      if (!t || !Number.isFinite(value)) throw new Error("Invalid number");
    }
    while (tokens[pos] === "%") {
      pos++;
      value /= 100;
    }
    return value;
  }
  function power(): number {
    const left = atom();
    if (tokens[pos] === "^") {
      pos++;
      return left ** unary();
    }
    return left;
  }
  function unary(): number {
    if (tokens[pos] === "+") {
      pos++;
      return unary();
    }
    if (tokens[pos] === "-") {
      pos++;
      return -unary();
    }
    return power();
  }
  function product(): number {
    let n = unary();
    while (tokens[pos] === "*" || tokens[pos] === "/") {
      const op = tokens[pos++];
      const rhs = unary();
      n = op === "*" ? n * rhs : n / rhs;
    }
    return n;
  }
  function sum(): number {
    let n = product();
    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const op = tokens[pos++];
      const rhs = product();
      n = op === "+" ? n + rhs : n - rhs;
    }
    return n;
  }
  const result = sum();
  if (pos !== tokens.length || !Number.isFinite(result)) throw new Error("Invalid result");
  return Number(result.toPrecision(14));
}
