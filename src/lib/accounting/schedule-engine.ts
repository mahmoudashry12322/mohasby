import { D, sum } from "./calculations";
import { Prisma } from "@prisma/client";
type Value = string | Prisma.Decimal | Value[];
type Node =
  | { type: "literal"; value: string }
  | { type: "ref"; value: string }
  | { type: "binary"; op: string; left: Node; right: Node }
  | { type: "call"; name: string; args: Node[] };
// Restricted parser: no eval, JavaScript, filesystem or network expressions.
export function parseFormula(formula: string): Node {
  const tokens =
    formula.match(
      /Table\d+\[[^\]]+\]|"(?:[^"]|"")*"|[A-Z]+\d+|[A-Z][A-Z0-9_]*|\d+(?:\.\d+)?|<=|>=|<>|[<>=()+\-*/,:]/g,
    ) || [];
  if (
    tokens.join("") !== formula.replace(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g, "")
  ) {
    // Table column labels contain spaces; tokenization preserves them.
    const joined = tokens.join("");
    if (joined.replace(/\s/g, "") !== formula.replace(/\s/g, ""))
      throw new Error("Unsupported formula syntax");
  }
  let pos = 0;
  function primary(): Node {
    const token = tokens[pos++];
    if (!token) throw new Error("Unexpected end");
    if (token === "(") {
      const node = expression();
      if (tokens[pos++] !== ")") throw new Error("Missing )");
      return node;
    }
    if (token === "-")
      return {
        type: "binary",
        op: "-",
        left: { type: "literal", value: "0" },
        right: primary(),
      };
    if (/^\d/.test(token) || token.startsWith('"'))
      return {
        type: "literal",
        value: token.startsWith('"')
          ? token.slice(1, -1).replace(/""/g, '"')
          : token,
      };
    if (tokens[pos] === "(") {
      pos++;
      const args: Node[] = [];
      if (tokens[pos] !== ")") {
        do {
          args.push(expression());
          if (tokens[pos] !== ",") break;
          pos++;
        } while (true);
      }
      if (tokens[pos++] !== ")") throw new Error("Missing )");
      return { type: "call", name: token, args };
    }
    if (tokens[pos] === ":") {
      pos++;
      return { type: "ref", value: token + ":" + tokens[pos++] };
    }
    return { type: "ref", value: token };
  }
  function product(): Node {
    let node = primary();
    while (["*", "/"].includes(tokens[pos])) {
      const op = tokens[pos++];
      node = { type: "binary", op, left: node, right: primary() };
    }
    return node;
  }
  function addition(): Node {
    let node = product();
    while (["+", "-"].includes(tokens[pos])) {
      const op = tokens[pos++];
      node = { type: "binary", op, left: node, right: product() };
    }
    return node;
  }
  function expression(): Node {
    let node = addition();
    if (["<", ">", "=", "<=", ">=", "<>"].includes(tokens[pos])) {
      const op = tokens[pos++];
      node = { type: "binary", op, left: node, right: addition() };
    }
    return node;
  }
  const result = expression();
  if (pos !== tokens.length) throw new Error("Unexpected token");
  return result;
}
const number = (v: Value): Prisma.Decimal => {
  if (Array.isArray(v)) throw new Error("Expected scalar");
  if (v === "") return D(0);
  const n = D(v);
  if (!n.isFinite()) throw new Error("Unavailable number");
  return n;
};
const flat = (values: Value[]): Value[] => {
  const out: Value[] = [];
  for (const value of values) {
    if (Array.isArray(value)) out.push(...flat(value));
    else out.push(value);
  }
  return out;
};
export function evaluateFormula(
  node: Node,
  resolve: (ref: string) => Value,
): Value {
  const ev = (n: Node) => evaluateFormula(n, resolve);
  if (node.type === "literal") return node.value;
  if (node.type === "ref") return resolve(node.value);
  if (node.type === "binary") {
    const a = number(ev(node.left)),
      b = number(ev(node.right));
    switch (node.op) {
      case "+":
        return a.add(b);
      case "-":
        return a.sub(b);
      case "*":
        return a.mul(b);
      case "/":
        if (b.isZero()) throw new Error("Division by zero");
        return a.div(b);
      case "<":
        return a.lt(b) ? "1" : "0";
      case ">":
        return a.gt(b) ? "1" : "0";
      case "=":
        return a.eq(b) ? "1" : "0";
      case "<=":
        return a.lte(b) ? "1" : "0";
      case ">=":
        return a.gte(b) ? "1" : "0";
      case "<>":
        return !a.eq(b) ? "1" : "0";
    }
    throw new Error("Invalid operator");
  }
  if (node.name === "IFERROR") {
    try {
      return ev(node.args[0]);
    } catch {
      return ev(node.args[1]);
    }
  }
  if (node.name === "IF")
    return ev(number(ev(node.args[0])).isZero() ? node.args[2] : node.args[1]);
  const args = node.args.map(ev);
  if (node.name === "SUM") return sum(flat(args).map(number));
  if (node.name === "SUBTOTAL") {
    const code = number(args[0]).toNumber(),
      values = flat(args.slice(1)).map(number);
    if (code === 1) {
      if (!values.length) throw new Error("Empty average");
      return sum(values).div(values.length);
    }
    if (code === 9) return sum(values);
    throw new Error("Unsupported subtotal");
  }
  if (["SUMIFS", "MAXIFS", "SUMIF"].includes(node.name)) {
    const single = node.name === "SUMIF",
      values = (single ? args[2] : args[0]) as Value[];
    if (!Array.isArray(values)) throw new Error("Expected range");
    const pairs = single ? [args[0], args[1]] : args.slice(1);
    const selected = values
      .filter((_, i) => {
        for (let p = 0; p < pairs.length; p += 2) {
          const range = pairs[p];
          if (
            !Array.isArray(range) ||
            String(range[i] ?? "").replace(/[.\s]+/g, "") !==
              String(pairs[p + 1]).replace(/[.\s]+/g, "")
          )
            return false;
        }
        return true;
      })
      .map(number);
    if (node.name === "MAXIFS")
      return selected.length ? Prisma.Decimal.max(...selected) : D(0);
    return sum(selected);
  }
  throw new Error("Unsupported function " + node.name);
}
export function scheduleValues(
  template: {
    labels: Record<string, string>;
    formulas: Record<string, string>;
    inputs: Record<string, string>;
    selectors: Record<string, string>;
  },
  inputs: Record<string, string>,
  context: Record<string, string>,
  tables: Record<string, Record<string, string>[]>,
) {
  const cache = new Map<string, Value>(),
    active = new Set<string>(),
    errors: Record<string, string> = {};
  function resolve(ref: string): Value {
    const table = /^(Table\d+)\[(.+)\]$/.exec(ref);
    if (table)
      return (tables[table[1]] || []).map((row) => row[table[2]] || "");
    const range = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(ref);
    if (range) {
      if (range[1] !== range[3]) {
        if (
          range[2] !== range[4] ||
          range[1].length !== 1 ||
          range[3].length !== 1
        )
          throw new Error("Unsupported multi-column range");
        return Array.from(
          { length: range[3].charCodeAt(0) - range[1].charCodeAt(0) + 1 },
          (_, i) =>
            resolve(String.fromCharCode(range[1].charCodeAt(0) + i) + range[2]),
        );
      }
      return Array.from(
        { length: Number(range[4]) - Number(range[2]) + 1 },
        (_, i) => resolve(range[1] + (Number(range[2]) + i)),
      );
    }
    if (cache.has(ref)) return cache.get(ref)!;
    if (Object.hasOwn(template.selectors, ref))
      return context[template.selectors[ref]] || "";
    if (Object.hasOwn(template.labels, ref)) return template.labels[ref];
    if (Object.hasOwn(template.inputs, ref)) {
      if (inputs[ref] === undefined || inputs[ref] === "")
        throw new Error("مدخل مطلوب: " + template.inputs[ref]);
      return inputs[ref];
    }
    if (!template.formulas[ref]) return "";
    if (active.has(ref)) throw new Error("Circular reference " + ref);
    active.add(ref);
    try {
      const value = evaluateFormula(
        parseFormula(template.formulas[ref]),
        resolve,
      );
      cache.set(ref, value);
      return value;
    } finally {
      active.delete(ref);
    }
  }
  const values: Record<string, string> = {};
  for (const cell of Object.keys(template.formulas)) {
    try {
      const v = resolve(cell);
      values[cell] =
        v instanceof Prisma.Decimal
          ? v.toDecimalPlaces(6).toString()
          : String(v);
    } catch (e) {
      values[cell] = "غير متاح";
      errors[cell] = (e as Error).message;
    }
  }
  for (const [cell, label] of Object.entries(template.inputs))
    if (inputs[cell] === undefined || inputs[cell] === "")
      errors[cell] = "مدخل مطلوب: " + label;
  return { values, errors };
}
