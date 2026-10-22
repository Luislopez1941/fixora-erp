/**
 * Fórmula del precio de las variantes: lista de fichas (JSON) → árbol → resultado.
 * Evaluador propio (descenso recursivo), sin eval ni new Function.
 * ESTE ARCHIVO ES IDÉNTICO en el backend (src/variant-templates/price-formula.ts) y en el frontend
 * (src/modules/catalogos/productos-y-servicios/variantes/priceFormula.ts): si cambias uno, copia el otro.
 */

export type FormulaOp = '+' | '-' | '*' | '/';
export type FormulaFn = 'ROUND' | 'MIN' | 'MAX';
export type FormulaToken =
  | { t: 'num'; v: number }
  | { t: 'base' }
  | { t: 'adj' }
  | { t: 'axis'; name: string }
  | { t: 'op'; v: FormulaOp }
  | { t: '(' }
  | { t: ')' }
  | { t: ',' }
  | { t: '%' }
  | { t: 'fn'; v: FormulaFn };

/** Lo que la fórmula necesita saber de cada característica (eje) de la plantilla. */
export interface FormulaAxis {
  position: number;
  name: string;
  type: string;
  unit?: string | null;
  options?: { value: string; adjust?: number; adjustType?: 'PERCENT' }[];
}

export const MAX_FORMULA_TOKENS = 60;
export const FN_LABEL: Record<FormulaFn, string> = { ROUND: 'Redondear', MIN: 'Mínimo', MAX: 'Máximo' };
const OP_LABEL: Record<FormulaOp, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
/** Antes de calcular, las medidas pasan a su unidad base: cm y mm → m, g → kg, ml → L. */
export const UNIT_TO_BASE: Record<string, { unit: string; factor: number }> = {
  cm: { unit: 'm', factor: 0.01 },
  mm: { unit: 'm', factor: 0.001 },
  g: { unit: 'kg', factor: 0.001 },
  ml: { unit: 'L', factor: 0.001 },
};

export class FormulaError extends Error {}
class MissingValue extends Error {}

const num = (v: unknown) => Number(String(v ?? '').trim().replace(',', '.'));
const same = (a: string, b: string) => a.trim().toLocaleLowerCase('es-MX') === b.trim().toLocaleLowerCase('es-MX');
const isNumericAxis = (a: FormulaAxis) => a.type === 'NUMBER' || a.type === 'MEASURE';

/** Valor de una característica ya en unidad base (120 cm → 1.2); null si no es número. */
export function axisNumber(axis: Pick<FormulaAxis, 'unit'>, raw: string | null | undefined) {
  const n = num(raw);
  if (raw == null || String(raw).trim() === '' || !Number.isFinite(n)) return null;
  const conv = axis.unit ? UNIT_TO_BASE[axis.unit] : undefined;
  return conv ? n * conv.factor : n;
}

/** Limpia la fórmula que manda el cliente (solo fichas conocidas). null = sin fórmula. */
export function normalizeFormula(input: unknown): FormulaToken[] | null {
  if (input === null || input === undefined || (Array.isArray(input) && !input.length)) return null;
  if (!Array.isArray(input)) throw new FormulaError('La fórmula no es válida.');
  if (input.length > MAX_FORMULA_TOKENS) throw new FormulaError(`La fórmula es muy larga (máximo ${MAX_FORMULA_TOKENS} fichas).`);
  return input.map((raw: any): FormulaToken => {
    switch (raw?.t) {
      case 'num': {
        const v = num(raw.v);
        if (!Number.isFinite(v) || Math.abs(v) > 1e12) throw new FormulaError(`"${raw.v}" no es un número válido.`);
        return { t: 'num', v };
      }
      case 'axis': {
        const name = String(raw.name ?? '').trim().slice(0, 40);
        if (!name) throw new FormulaError('Hay una característica sin nombre en la fórmula.');
        return { t: 'axis', name };
      }
      case 'op':
        if (!['+', '-', '*', '/'].includes(raw.v)) throw new FormulaError('Operación no válida en la fórmula.');
        return { t: 'op', v: raw.v };
      case 'fn':
        if (!['ROUND', 'MIN', 'MAX'].includes(raw.v)) throw new FormulaError('Función no válida en la fórmula.');
        return { t: 'fn', v: raw.v };
      case 'base':
      case 'adj':
      case '(':
      case ')':
      case ',':
      case '%':
        return { t: raw.t };
      default:
        throw new FormulaError('La fórmula tiene una ficha desconocida.');
    }
  });
}

type Node =
  | { k: 'num'; v: number }
  | { k: 'base' }
  | { k: 'adj' }
  | { k: 'axis'; name: string }
  | { k: 'neg'; a: Node }
  | { k: 'pct'; a: Node }
  | { k: 'bin'; op: FormulaOp; a: Node; b: Node }
  | { k: 'fn'; fn: FormulaFn; args: Node[] };

/** Nombre corto de una ficha para los mensajes de error. */
export function tokenLabel(tk: FormulaToken) {
  switch (tk.t) {
    case 'num':
      return String(tk.v);
    case 'base':
      return 'Precio';
    case 'adj':
      return 'Ajustes';
    case 'axis':
      return tk.name;
    case 'op':
      return OP_LABEL[tk.v];
    case 'fn':
      return FN_LABEL[tk.v];
    default:
      return tk.t;
  }
}

const isValueStart = (tk?: FormulaToken) => !!tk && ['num', 'base', 'adj', 'axis', '(', 'fn'].includes(tk.t);

/** Fichas → árbol. Precedencia: ( ) y funciones, %, signo −, × ÷, + −. */
function parse(tokens: FormulaToken[]): Node {
  if (!tokens.length) throw new FormulaError('La fórmula está vacía.');
  let i = 0;
  const fail = (m: string): never => {
    throw new FormulaError(m);
  };
  const peek = () => tokens[i];
  const isOp = (tk: FormulaToken | undefined, ...ops: FormulaOp[]) => tk?.t === 'op' && ops.includes(tk.v);

  const expr = (): Node => {
    let n = term();
    while (isOp(peek(), '+', '-')) {
      const op = (tokens[i++] as { v: FormulaOp }).v;
      n = { k: 'bin', op, a: n, b: term() };
    }
    return n;
  };
  const term = (): Node => {
    let n = unary();
    while (isOp(peek(), '*', '/')) {
      const op = (tokens[i++] as { v: FormulaOp }).v;
      n = { k: 'bin', op, a: n, b: unary() };
    }
    return n;
  };
  const unary = (): Node => {
    if (isOp(peek(), '-')) {
      i++;
      return { k: 'neg', a: unary() };
    }
    let n = primary();
    while (peek()?.t === '%') {
      i++;
      n = { k: 'pct', a: n };
    }
    return n;
  };
  const closeParen = (what: string) => {
    const tk = tokens[i];
    if (tk?.t === ')') return void i++;
    if (isValueStart(tk)) fail(`Falta un operador (+ − × ÷) antes de "${tokenLabel(tk!)}".`);
    fail(`Falta cerrar el paréntesis ${what}.`);
  };
  const primary = (): Node => {
    const tk = tokens[i++];
    if (!tk) return fail('La fórmula está incompleta: falta un valor al final.');
    switch (tk.t) {
      case 'num':
        return { k: 'num', v: tk.v };
      case 'base':
        return { k: 'base' };
      case 'adj':
        return { k: 'adj' };
      case 'axis':
        return { k: 'axis', name: tk.name };
      case '(': {
        if (peek()?.t === ')') fail('Hay unos paréntesis vacíos.');
        const n = expr();
        closeParen('que abriste');
        return n;
      }
      case 'fn': {
        const label = FN_LABEL[tk.v];
        if (tokens[i++]?.t !== '(') fail(`Después de ${label} va un paréntesis: ${label}( … ).`);
        if (peek()?.t === ')') fail(`${label} necesita al menos un valor.`);
        const args = [expr()];
        while (peek()?.t === ',') {
          i++;
          args.push(expr());
        }
        closeParen(`de ${label}`);
        if (tk.v === 'ROUND' && args.length > 2) fail('Redondear lleva un valor y, opcional, cuántos decimales: Redondear(valor, 2).');
        if (tk.v !== 'ROUND' && args.length < 2) fail(`${label} compara dos o más valores separados por coma: ${label}(a, b).`);
        return { k: 'fn', fn: tk.v, args };
      }
      case 'op':
        return fail(`Falta un valor antes de "${OP_LABEL[tk.v]}".`);
      case ')':
        return fail('Hay un paréntesis que cierra sin haber abierto.');
      case ',':
        return fail('La coma solo va dentro de Mínimo, Máximo o Redondear.');
      default:
        return fail('El % va después de un número, por ejemplo 15 %.');
    }
  };

  const tree = expr();
  if (i < tokens.length) {
    const tk = tokens[i];
    if (tk.t === ')') fail('Hay un paréntesis que cierra sin haber abierto.');
    if (tk.t === ',') fail('La coma solo va dentro de Mínimo, Máximo o Redondear.');
    fail(`Falta un operador (+ − × ÷) antes de "${tokenLabel(tk)}".`);
  }
  return tree;
}

interface Ctx {
  base: number;
  adj: number;
  value: (name: string) => number | null;
}

function evaluate(n: Node, ctx: Ctx): number {
  switch (n.k) {
    case 'num':
      return n.v;
    case 'base':
      return ctx.base;
    case 'adj':
      return ctx.adj;
    case 'axis': {
      const v = ctx.value(n.name);
      if (v == null) throw new MissingValue(n.name);
      return v;
    }
    case 'neg':
      return -evaluate(n.a, ctx);
    case 'pct':
      // 15 % = 15 % del precio del artículo
      return (evaluate(n.a, ctx) / 100) * ctx.base;
    case 'bin': {
      const a = evaluate(n.a, ctx);
      const b = evaluate(n.b, ctx);
      if (n.op === '+') return a + b;
      if (n.op === '-') return a - b;
      if (n.op === '*') return a * b;
      if (b === 0) throw new FormulaError('La fórmula divide entre 0.');
      return a / b;
    }
    case 'fn': {
      const args = n.args.map((x) => evaluate(x, ctx));
      if (n.fn === 'MIN') return Math.min(...args);
      if (n.fn === 'MAX') return Math.max(...args);
      const d = Math.max(0, Math.min(6, Math.round(args[1] ?? 0)));
      return Math.round(args[0] * 10 ** d) / 10 ** d;
    }
  }
}

const hasVars = (n: Node): boolean =>
  n.k === 'axis' || n.k === 'base' || n.k === 'adj' || n.k === 'pct'
    ? true
    : n.k === 'neg'
      ? hasVars(n.a)
      : n.k === 'bin'
        ? hasVars(n.a) || hasVars(n.b)
        : n.k === 'fn'
          ? n.args.some(hasVars)
          : false;

/**
 * Revisa la fórmula contra las características de la plantilla. Devuelve el mensaje de error (en español sencillo) o null.
 * Detecta: sintaxis, características que no existen o que no son número, y división entre un 0 fijo.
 */
export function formulaError(tokens: FormulaToken[] | null, axes: FormulaAxis[]): string | null {
  if (!tokens || !tokens.length) return null;
  try {
    if (tokens.length > MAX_FORMULA_TOKENS) return `La fórmula es muy larga (máximo ${MAX_FORMULA_TOKENS} fichas).`;
    const tree = parse(tokens);
    const walk = (n: Node): void => {
      if (n.k === 'axis') {
        const a = axes.find((x) => same(x.name, n.name));
        if (!a) throw new FormulaError(`"${n.name}" no es una característica de esta plantilla.`);
        if (!isNumericAxis(a)) throw new FormulaError(`"${a.name}" no es un número: solo las características de tipo Número o Medida entran en la fórmula.`);
      } else if (n.k === 'neg' || n.k === 'pct') walk(n.a);
      else if (n.k === 'bin') {
        walk(n.a);
        walk(n.b);
        if (n.op === '/' && !hasVars(n.b) && evaluate(n.b, { base: 0, adj: 0, value: () => 0 }) === 0) throw new FormulaError('La fórmula divide entre 0.');
      } else if (n.k === 'fn') n.args.forEach(walk);
    };
    walk(tree);
    return null;
  } catch (e) {
    if (e instanceof FormulaError) return e.message;
    throw e;
  }
}

/**
 * Precio de una combinación. Orden: fórmula (con las medidas en unidad base) y después los ajustes por valor (XL +$20),
 * salvo que la fórmula tenga la ficha "Ajustes" (entonces entran donde está la ficha).
 * Sin fórmula: precio del artículo + ajustes (o null si tampoco hay ajustes = usa el precio del artículo).
 * null si falta algún valor; lanza FormulaError si la cuenta no se puede hacer (p. ej. divide entre 0).
 */
export function variantPrice(
  formula: FormulaToken[] | null | undefined,
  axes: FormulaAxis[],
  values: Record<number, string | null | undefined>,
  base: number | null | undefined,
): number | null {
  if (base == null || !Number.isFinite(base)) return null;
  let amount = 0;
  let percent = 0;
  let adjusted = false;
  for (const a of axes) {
    const v = values[a.position];
    const o = v ? a.options?.find((x) => same(x.value, v)) : undefined;
    if (!o?.adjust) continue;
    adjusted = true;
    if (o.adjustType === 'PERCENT') percent += o.adjust;
    else amount += o.adjust;
  }
  let price: number;
  if (formula && formula.length) {
    const inside = formula.some((t) => t.t === 'adj');
    try {
      price = evaluate(parse(formula), {
        base,
        adj: amount + (base * percent) / 100,
        value: (name) => {
          const a = axes.find((x) => same(x.name, name));
          return a ? axisNumber(a, values[a.position]) : null;
        },
      });
    } catch (e) {
      if (e instanceof MissingValue) return null;
      throw e;
    }
    if (!inside) price = price + (price * percent) / 100 + amount;
  } else {
    if (!adjusted) return null;
    price = base + (base * percent) / 100 + amount;
  }
  if (!Number.isFinite(price)) return null;
  return Math.max(0, Math.round(price * 100) / 100);
}

const money = (n: number) => `$${(Math.round(n * 100) / 100).toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;

/** Fichas → texto: "(Precio × Ancho × Alto) ÷ Piezas". Con `example` pone los valores: "($300 × 120 cm × 80 cm) ÷ 4". */
export function formulaText(
  tokens: FormulaToken[] | null | undefined,
  example?: { base: number; adj: number; axes: FormulaAxis[]; values: Record<number, string | null | undefined> },
) {
  if (!tokens || !tokens.length) return '';
  let out = '';
  tokens.forEach((tk, i) => {
    let piece: string;
    if (example && tk.t === 'base') piece = money(example.base);
    else if (example && tk.t === 'adj') piece = money(example.adj);
    else if (example && tk.t === 'axis') {
      const a = example.axes.find((x) => same(x.name, tk.name));
      const raw = a ? example.values[a.position] : null;
      piece = raw ? `${raw}${a?.unit ? ` ${a.unit}` : ''}` : tk.name;
    } else piece = tokenLabel(tk);
    const prev = tokens[i - 1];
    const tight = !out || tk.t === ')' || tk.t === ',' || tk.t === '%' || prev?.t === '(' || prev?.t === 'fn';
    out += (tight ? '' : ' ') + piece;
  });
  return out;
}

/** Palabras que se pueden escribir a mano además de los nombres de las características. */
const WORDS: { words: string[]; token: FormulaToken }[] = [
  { words: ['precio base', 'precio'], token: { t: 'base' } },
  { words: ['ajustes', 'ajuste'], token: { t: 'adj' } },
  { words: ['redondear'], token: { t: 'fn', v: 'ROUND' } },
  { words: ['mínimo', 'minimo', 'min'], token: { t: 'fn', v: 'MIN' } },
  { words: ['máximo', 'maximo', 'max'], token: { t: 'fn', v: 'MAX' } },
];
const SYMBOLS: Record<string, FormulaToken> = {
  '+': { t: 'op', v: '+' },
  '-': { t: 'op', v: '-' },
  '−': { t: 'op', v: '-' },
  '*': { t: 'op', v: '*' },
  '×': { t: 'op', v: '*' },
  '/': { t: 'op', v: '/' },
  '÷': { t: 'op', v: '/' },
  '(': { t: '(' },
  ')': { t: ')' },
  ',': { t: ',' },
  ';': { t: ',' },
  '%': { t: '%' },
};

/** Texto escrito a mano → fichas: "(Precio × Ancho × Alto) ÷ Piezas". Los decimales llevan punto (1.15). */
export function parseFormulaText(text: string, axisNames: string[]): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  const candidates = [
    ...axisNames.map((name) => ({ word: name, token: { t: 'axis', name } as FormulaToken })),
    ...WORDS.flatMap((w) => w.words.map((word) => ({ word, token: w.token }))),
  ].sort((a, b) => b.word.length - a.word.length);
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (SYMBOLS[ch]) {
      tokens.push(SYMBOLS[ch]);
      i++;
      continue;
    }
    const m = /^\d+(\.\d+)?/.exec(text.slice(i));
    if (m) {
      tokens.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    const rest = text.slice(i).toLocaleLowerCase('es-MX');
    const hit = candidates.find((c) => {
      const w = c.word.toLocaleLowerCase('es-MX');
      return rest.startsWith(w) && !/[\p{L}\d_]/u.test(rest.charAt(w.length));
    });
    if (hit) {
      tokens.push(hit.token);
      i += hit.word.length;
      continue;
    }
    const word = /^[\p{L}\d_]+/u.exec(text.slice(i))?.[0] ?? ch;
    throw new FormulaError(`"${word}" no es una característica de la plantilla ni una palabra conocida.`);
  }
  return tokens;
}

/** Clave de la ficha del artículo con el precio que usa la fórmula cuando el precio de venta se calcula (artículo sin variantes). */
export const PRICE_BASE_KEY = 'Precio base';

/**
 * Datos del artículo de tipo Número o Medida (p. ej. Ancho y Alto "solo para el precio"): la fórmula los usa como si fueran
 * características, con el valor de la ficha del artículo. Van en las posiciones 101, 102… para no chocar con los ejes (1–3).
 */
export function withFieldInputs(
  axes: FormulaAxis[],
  values: Record<number, string | null | undefined>,
  fields: { name: string; type: string; unit?: string | null }[] | null | undefined,
  attributes: Record<string, unknown> | null | undefined,
): { axes: FormulaAxis[]; values: Record<number, string | null | undefined> } {
  const numeric = (fields ?? []).filter((f) => f.type === 'NUMBER' || f.type === 'MEASURE');
  if (!numeric.length) return { axes, values };
  const extra = numeric.map((f, i): FormulaAxis => ({ position: 101 + i, name: f.name, type: f.type, unit: f.unit ?? null, options: [] }));
  const more: Record<number, string | null | undefined> = {};
  extra.forEach((a) => {
    const key = Object.keys(attributes ?? {}).find((k) => same(k, a.name));
    const v = key ? (attributes as Record<string, unknown>)[key] : null;
    more[a.position] = v == null || v === '' ? null : String(v);
  });
  return { axes: [...axes, ...extra], values: { ...values, ...more } };
}

/** Cálculos del formato anterior (un solo modo por plantilla) → la fórmula equivalente (mismo precio). */
export function formulaFromRule(rule: string | null | undefined, axes: FormulaAxis[]): FormulaToken[] | null {
  if (!rule) return null;
  const lengths = axes.filter((a) => a.type === 'MEASURE' && ['m', 'cm', 'mm'].includes(a.unit ?? ''));
  const numbers = axes.filter(isNumericAxis);
  const times = (list: FormulaAxis[]): FormulaToken[] => [{ t: 'base' }, ...list.flatMap((a): FormulaToken[] => [{ t: 'op', v: '*' }, { t: 'axis', name: a.name }])];
  if (rule === 'AREA') {
    const m2 = axes.find((a) => a.type === 'MEASURE' && a.unit === 'm²');
    if (m2) return times([m2]);
    return lengths.length >= 2 ? times(lengths.slice(0, 2)) : null;
  }
  if (rule === 'LENGTH') return lengths.length ? times([lengths[0]]) : null;
  if (!numbers.length) return null;
  // Antes multiplicar / dividir usaba el número tal cual (500 ml); ahora las medidas pasan a unidad base (0.5 L): se compensa
  const conv = numbers[0].unit ? UNIT_TO_BASE[numbers[0].unit] : undefined;
  const back: FormulaToken[] = conv ? [{ t: 'op', v: rule === 'DIVIDE' ? '/' : '*' }, { t: 'num', v: Math.round(1 / conv.factor) }] : [];
  if (rule === 'MULTIPLY') return [...times([numbers[0]]), ...back];
  if (rule === 'DIVIDE') return [{ t: 'base' }, { t: 'op', v: '/' }, { t: 'axis', name: numbers[0].name }, ...back];
  return null;
}
