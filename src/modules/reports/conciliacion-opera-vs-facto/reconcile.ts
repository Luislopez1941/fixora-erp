/**
 * Conciliación OPERA FACTURADO (PMS del hotel) contra Facto (facturas timbradas).
 *
 * Cómo se arman las llaves en los archivos del hotel:
 *   · OPERA  CONCAT   = CONFIRMACION & TOTAL_PAGO     & FECHA (serie de Excel)
 *   · Facto  ID ÚNICO = RESERVA      & TOTAL PAGADO   & FECHA_FACTURA (serie de Excel)
 *   · Facto  FISCAL_BILL_FOLIO = FOLIO_OPERA de OPERA (en facturas de recepción)
 *
 * En OPERA la CONFIRMACIÓN se repite (una reserva con varios folios) y en Facto la RESERVA también puede repetirse
 * (varias facturas por estancia). Por eso no se cruza "ID ÚNICO = CONFIRMACIÓN" a secas: se cruza por niveles,
 * del más seguro al menos seguro, y cada fila de OPERA se usa una sola vez:
 *
 *   1. UUID          FOLIO_FISCAL (Facto)       = FOLIO_FACTURA (OPERA)
 *   2. Folio         FISCAL_BILL_FOLIO (Facto)  = FOLIO_OPERA (OPERA)   (y misma confirmación si ambas vienen)
 *   3. Llave         ID ÚNICO (Facto)           = CONCAT (OPERA)
 *   4. Confirmación  RESERVA = CONFIRMACIÓN, o el ID ÚNICO empieza con la confirmación, y luego:
 *        a) entre las filas de esa confirmación, la del mismo monto,
 *        b) si ninguna coincide sola, la suma de las filas de la confirmación (factura de varios folios),
 *        c) si solo queda una fila, se empareja y se marca la diferencia,
 *        d) si quedan varias y ninguna cuadra → "Ambigua", para elegir a mano (no se adivina).
 *
 * El monto que se compara es el TOTAL PAGADO de Facto (el que va en el ID ÚNICO; incluye servicio y propina)
 * contra TOTAL_INGRESOS / TOTAL_PAGO / TOTAL_PAGADO de OPERA, con una tolerancia de centavos por redondeo.
 */
import type { Cell } from './xlsxReader'
import type { Adjustment } from './adjustments'

// ───────────────────────── utilidades ─────────────────────────

export const normHeader = (s: unknown) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()

/** Arregla textos con acentos dañados al exportar (ej. "Tarjeta de crÃ©dito" → "Tarjeta de crédito"). */
export function fixText(v: unknown): string {
  const s = String(v ?? '').trim()
  if (!/[ÃÂ]/.test(s)) return s
  try {
    return decodeURIComponent(escape(s))
  } catch {
    return s
  }
}

export function toNum(v: Cell | undefined): number {
  if (typeof v === 'number') return v
  let s = String(v ?? '').trim()
  if (!s || /^[-–\s]+$/.test(s)) return 0
  let neg = false
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1) }
  s = s.replace(/[$\s]/g, '')
  // 1.234,56 → 1234.56 ; 1,234.56 → 1234.56
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/,/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? (neg ? -n : n) : 0
}

/** Llave comparable: sin espacios, mayúsculas; los números se escriben como Excel los concatena (sin ceros de más). */
export function normKey(v: Cell | undefined): string {
  if (v == null) return ''
  if (typeof v === 'number') return String(Number(v.toFixed(10)))
  return String(v).trim().replace(/\s+/g, '').toUpperCase()
}

const MONTHS: Record<string, number> = {
  ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12, dec: 12,
}

/** Devuelve la fecha como número de serie de Excel (días desde 1899-12-30), o null. */
export function toSerial(v: Cell | undefined): number | null {
  if (typeof v === 'number') return v > 20000 && v < 80000 ? Math.floor(v) : null
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return null
  const serial = (y: number, m: number, d: number) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000)
  const fixYear = (y: number) => (y < 100 ? 2000 + y : y)
  let m = s.match(/^(\d{1,2})[-/ ]([a-z]{3})[a-z]*\.?[-/ ](\d{2,4})/)
  if (m && MONTHS[m[2]]) return serial(fixYear(Number(m[3])), MONTHS[m[2]], Number(m[1]))
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return serial(Number(m[1]), Number(m[2]), Number(m[3]))
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) return serial(fixYear(Number(m[3])), Number(m[2]), Number(m[1])) // dd/mm/aaaa (formato México)
  return null
}

export const serialToText = (serial: number | null) => {
  if (serial == null) return ''
  const d = new Date(Date.UTC(1899, 11, 30) + serial * 86400000)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Derecho de saneamiento ambiental por noche (Cancún). Suma al total de recepción pero no viene como impuesto en Facto. */
export const SANEAMIENTO_POR_NOCHE = 85.4

// ───────────────────────── lectura de hojas ─────────────────────────

type Getter = (row: Cell[], ...names: string[]) => Cell | undefined

/** Nombre de columna canónico: sin acentos, espacios ni guiones, y con los sinónimos más comunes unificados. */
const ALIASES: [RegExp, string][] = [
  [/^(NO|NUM|NUMERO)?(DE)?CONF(IRMACION|IRMATION|IRM)?(NO|NUM|NUMERO|NUMBER)?$/, 'CONFIRMACION'],
  [/^(NO|NUM|NUMERO)?(DE)?RESERVA(CION)?(NO|NUM)?$/, 'RESERVA'],
  [/^(UUID|FOLIOFISCAL)$/, 'FOLIOFISCAL'],
  [/^IDUNICO$/, 'IDUNICO'],
]
export const canonHeader = (s: unknown) => {
  const compact = normHeader(s).replace(/ /g, '')
  for (const [re, name] of ALIASES) if (re.test(compact)) return name
  return compact
}

/** Busca la fila de encabezados (no siempre es la primera: puede haber títulos o filas vacías arriba). */
function locateHeader(rows: Cell[][], required: string[][]): { headerRow: number; get: Getter } | null {
  const req = required.map((alts) => alts.map(canonHeader))
  for (let r = 0; r < Math.min(rows.length, 200); r++) {
    const headers = (rows[r] ?? []).map(canonHeader)
    if (!req.every((alts) => alts.some((a) => headers.includes(a)))) continue
    const index = new Map<string, number>()
    headers.forEach((h, i) => { if (h && !index.has(h)) index.set(h, i) })
    const get: Getter = (row, ...names) => {
      for (const n of names) {
        const i = index.get(canonHeader(n))
        if (i != null) return row[i]
      }
      return undefined
    }
    return { headerRow: r, get }
  }
  return null
}

/** Para el mensaje de error: la fila con más textos entre las primeras (lo más parecido a un encabezado). */
export function describeHeaders(rows: Cell[][]): string {
  let best: Cell[] = []
  for (const row of rows.slice(0, 200)) {
    const texts = (row ?? []).filter((c) => typeof c === 'string' && c.trim())
    if (texts.length > best.length) best = texts
  }
  const list = best.map((c) => String(c).trim()).slice(0, 15)
  return list.length ? `Columnas que sí encontramos: ${list.join(', ')}${best.length > 15 ? '…' : ''}.` : 'La hoja parece vacía.'
}

/** Indica si una hoja tiene las columnas de OPERA / Facto (para reconocerla sola). */
export const sheetHas = (rows: Cell[][], required: string[][]) => locateHeader(rows, required) != null

const isEmptyRow = (row: Cell[]) => !row || row.every((c) => c == null || String(c).trim() === '')

export const OPERA_REQUIRED = [['CONFIRMACION'], ['TOTAL INGRESOS', 'TOTAL PAGO', 'TOTAL PAGADO']]
export const FACTO_REQUIRED = [['ID UNICO', 'FOLIO FISCAL', 'RESERVA'], ['TOTAL']]

export interface OperaRow {
  key: string
  excelRow: number
  cashier: string
  fecha: number | null
  concat: string
  confirmacion: string
  habitacion: string
  folioOpera: string
  uuid: string
  rfc: string
  estatusFactura: string
  totalIngresos: number
  totalPago: number
  totalPagado: number
  /** Parte de la cuenta que quedó como cuenta por cobrar (columna CXC). */
  cxc: number
  info: string
}

export interface FactoRow {
  key: string
  excelRow: number
  tipo: string
  esPago: boolean
  centro: string
  serieFolio: string
  uuid: string
  fecha: number | null
  estatus: string
  cancelada: boolean
  rfcReceptor: string
  receptor: string
  subtotal: number
  impuestos: number
  total: number
  totalPagado: number
  formaPago: string
  reserva: string
  huesped: string
  habitacion: string
  fiscalBillFolio: string
  idUnico: string
  concepto: string
  /** Problemas de la propia factura (no del cruce). */
  checks: string[]
}

export function readOpera(rows: Cell[][]): OperaRow[] {
  const h = locateHeader(rows, OPERA_REQUIRED)
  if (!h) throw new Error(`La hoja de OPERA no tiene las columnas CONFIRMACION y TOTAL_INGRESOS / TOTAL_PAGO. ${describeHeaders(rows)} Revisa que elegiste la hoja correcta en "Hoja OPERA".`)
  const { headerRow, get } = h
  const out: OperaRow[] = []
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? []
    if (isEmptyRow(row)) continue
    const confirmacion = normKey(get(row, 'CONFIRMACION'))
    const totalIngresos = toNum(get(row, 'TOTAL INGRESOS'))
    const totalPago = toNum(get(row, 'TOTAL PAGO'))
    const totalPagado = toNum(get(row, 'TOTAL PAGADO'))
    const cxc = toNum(get(row, 'CXC'))
    if (!confirmacion && !totalIngresos && !totalPago) continue
    out.push({
      key: `o${r}`,
      excelRow: r + 1,
      cashier: fixText(get(row, 'CASHIER', 'CAJERO')),
      fecha: toSerial(get(row, 'FECHA')),
      concat: normKey(get(row, 'CONCAT')),
      confirmacion,
      habitacion: fixText(get(row, 'HABITACION')),
      folioOpera: normKey(get(row, 'FOLIO OPERA')),
      uuid: String(get(row, 'FOLIO FACTURA', 'UUID') ?? '').trim().toLowerCase(),
      rfc: fixText(get(row, 'RFC')),
      estatusFactura: fixText(get(row, 'ESTATUS FACTURA')),
      totalIngresos,
      totalPago,
      totalPagado,
      cxc,
      info: fixText(get(row, 'INFO')),
    })
  }
  return out
}

export function readFacto(rows: Cell[][]): FactoRow[] {
  const h = locateHeader(rows, FACTO_REQUIRED)
  if (!h) throw new Error(`La hoja de Facto no tiene las columnas ID UNICO (o FOLIO_FISCAL) y TOTAL. ${describeHeaders(rows)} Revisa que elegiste la hoja correcta en "Hoja Facto".`)
  const { headerRow, get } = h
  const out: FactoRow[] = []
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? []
    if (isEmptyRow(row)) continue
    const subtotal = toNum(get(row, 'SUB TOTAL', 'SUB TOTAL MXN', 'SUBTOTAL'))
    const iva = toNum(get(row, 'IVA'))
    const taxNames = ['IVA', 'ISH', 'IEPS', 'IAEMS', 'IAFE', 'ISN', 'ISUIH', 'IUIH']
    const impuestos = round2(taxNames.reduce((acc, n) => acc + toNum(get(row, n)), 0))
    const total = toNum(get(row, 'TOTAL'))
    const totalPagado = toNum(get(row, 'TOTAL PAGADO'))
    const idUnico = normKey(get(row, 'ID UNICO'))
    const uuid = String(get(row, 'FOLIO FISCAL', 'UUID') ?? '').trim().toLowerCase()
    if (!idUnico && !uuid && !total) continue
    const tipo = fixText(get(row, 'TIPO FACTURA'))
    const esPago = /^pago/i.test(tipo)
    const estatus = fixText(get(row, 'ESTATUS'))
    const serie = fixText(get(row, 'SERIE'))
    const folio = fixText(get(row, 'FOLIO'))
    const reserva = normKey(get(row, 'RESERVA'))

    const checks: string[] = []
    const calc = round2(subtotal + impuestos)
    const diff = round2(total - calc)
    if (!esPago && subtotal && Math.abs(diff) > 0.05) {
      const noches = diff / SANEAMIENTO_POR_NOCHE
      const esSaneamiento = !!reserva && diff > 0 && Math.abs(noches - Math.round(noches)) < 0.002
      if (!esSaneamiento) {
        const tasa = iva && subtotal ? (iva / subtotal) * 100 : 0
        checks.push(
          `Subtotal + impuestos = ${calc.toFixed(2)} y el total es ${total.toFixed(2)} (dif. ${diff.toFixed(2)})` +
            (diff < 0 && tasa > 0 && tasa < 15.9 ? `. El IVA equivale al ${tasa.toFixed(1)}% del subtotal: parece un descuento que no se aplicó al subtotal` : ''),
        )
      }
    }

    out.push({
      key: `f${r}`,
      excelRow: r + 1,
      tipo,
      esPago,
      centro: fixText(get(row, 'CENTRO CONSUMO NOMBRE', 'SUCURSAL NOMBRE')),
      serieFolio: serie && folio ? `${serie}-${folio}` : serie || folio,
      uuid,
      fecha: toSerial(get(row, 'FECHA FACTURA', 'FECHA TIMBRADO')),
      estatus,
      cancelada: /CANCEL/i.test(estatus),
      rfcReceptor: fixText(get(row, 'RFC RECEPTOR')),
      receptor: fixText(get(row, 'RS RECEPTOR')),
      subtotal,
      impuestos,
      total,
      totalPagado,
      formaPago: fixText(get(row, 'FORMA PAGO')),
      reserva,
      huesped: fixText(get(row, 'NOMBRE HUESPED')),
      habitacion: fixText(get(row, 'HABITACION')),
      fiscalBillFolio: normKey(get(row, 'FISCAL BILL FOLIO')),
      idUnico,
      concepto: fixText(get(row, 'CONCEPTO')),
      checks,
    })
  }
  return out
}

// ───────────────────────── conciliación ─────────────────────────

export type MatchStatus = 'conciliada' | 'diferencia' | 'ambigua' | 'sin-opera' | 'sin-reserva' | 'fuera-periodo' | 'pago' | 'cancelada' | 'ajustada' | 'excluida'
export type MatchMethod =
  | 'UUID' | 'Folio OPERA' | 'ID único = CONCAT' | 'Confirmación + monto' | 'Confirmación (varios folios)' | 'Confirmación (único folio)' | 'Manual' | ''

export interface FactoResult {
  facto: FactoRow
  status: MatchStatus
  method: MatchMethod
  opera: OperaRow[]
  /** Monto de Facto con el que se comparó (TOTAL PAGADO o TOTAL). */
  factoAmount: number
  operaTotal: number
  diff: number
  confirmacion: string
  /** Filas de OPERA candidatas cuando la confirmación se repite y no se pudo decidir. */
  candidates: OperaRow[]
  notes: string[]
  /** Ajuste manual aplicado (si lo hay) y el estatus que tenía antes del ajuste. */
  adjustment?: Adjustment
  prevStatus?: MatchStatus
}

export interface OperaResult {
  opera: OperaRow
  facto: FactoRow | null
  status: OperaStatus
  repeated: number
  adjustment?: Adjustment
  prevStatus?: OperaStatus
}

export type OperaStatus = 'conciliada' | 'diferencia' | 'sin-facto' | 'solo-pago' | 'ajustada' | 'excluida'

export interface DuplicateGroup {
  confirmacion: string
  rows: OperaRow[]
  total: number
  facturas: string[]
}

export interface Reconciliation {
  facto: FactoResult[]
  opera: OperaResult[]
  duplicates: DuplicateGroup[]
  warnings: string[]
  operaRange: readonly [number, number] | null
  totals: {
    facto: number
    opera: number
    conciliado: number
    diferencias: number
  }
}

/** Montos de OPERA con los que se puede comparar la factura. */
/** En orden de preferencia: el pago (con el que se arma el CONCAT), lo pagado y los ingresos. */
const operaAmounts = (o: OperaRow) => [o.totalPago, o.totalPagado, o.totalIngresos].filter((n) => n > 0)

/**
 * Monto de varias filas de OPERA. Un mismo cobro puede venir en dos filas con el mismo folio
 * (una con el cargo en TOTAL_INGRESOS y otra con el pago en TOTAL_PAGO): eso es UN solo monto, no dos.
 * Por cada folio se toma lo mayor entre lo cargado y lo pagado, y se suman los folios distintos.
 */
export interface FolioGroup { folio: string; amount: number; ingresos: number; pago: number; pagado: number; cxc: number; rows: OperaRow[] }
export const folioGroups = (rows: OperaRow[]): FolioGroup[] => {
  const map = new Map<string, OperaRow[]>()
  for (const o of rows) map.set(o.folioOpera || o.key, [...(map.get(o.folioOpera || o.key) ?? []), o])
  return [...map].map(([folio, list]) => {
    const ingresos = round2(list.reduce((a, o) => a + o.totalIngresos, 0))
    const pago = round2(list.reduce((a, o) => a + o.totalPago, 0))
    const pagado = round2(list.reduce((a, o) => a + o.totalPagado, 0))
    const cxc = round2(list.reduce((a, o) => a + o.cxc, 0))
    return { folio, amount: Math.max(ingresos, pago, pagado), ingresos, pago, pagado, cxc, rows: list }
  })
}
export const operaRowsAmount = (rows: OperaRow[]) => round2(folioGroups(rows).reduce((a, g) => a + g.amount, 0))
/** Totales de OPERA por concepto (sumando folios distintos, sin repetir un mismo folio). */
export const operaTotals = (rows: OperaRow[]) => {
  const g = folioGroups(rows)
  const sum = (k: 'ingresos' | 'pago' | 'pagado' | 'cxc') => round2(g.reduce((a, x) => a + x[k], 0))
  return { ingresos: sum('ingresos'), pago: sum('pago'), pagado: sum('pagado'), cxc: sum('cxc') }
}
/** Montos de Facto: primero TOTAL PAGADO (el del ID ÚNICO), luego TOTAL. */
const factoAmounts = (f: FactoRow) => [...new Set([f.totalPagado, f.total].filter((n) => n > 0))]
const factoAmount = (f: FactoRow) => f.totalPagado || f.total

/** La pareja de montos (Facto, OPERA) más cercana. */
function bestPair(f: FactoRow, operaValues: number[]): { factoAmount: number; operaTotal: number; diff: number } {
  const fa = factoAmounts(f)
  if (!fa.length) fa.push(0)
  const ov = operaValues.length ? operaValues : [0]
  let best = { factoAmount: fa[0], operaTotal: ov[0], diff: round2(fa[0] - ov[0]) }
  for (const a of fa) for (const b of ov) {
    if (Math.abs(a - b) < Math.abs(best.diff)) best = { factoAmount: a, operaTotal: b, diff: round2(a - b) }
  }
  return best
}

const amountMatches = (f: FactoRow, o: OperaRow, tol: number) => factoAmounts(f).some((a) => operaAmounts(o).some((b) => Math.abs(a - b) <= tol))

export function reconcile(operaRows: OperaRow[], factoRows: FactoRow[], tolerance = 1): Reconciliation {
  const warnings: string[] = []
  const used = new Set<string>()
  const results = new Map<string, FactoResult>()

  const byUuid = new Map<string, OperaRow[]>()
  const byFolio = new Map<string, OperaRow[]>()
  const byConcat = new Map<string, OperaRow[]>()
  const byConf = new Map<string, OperaRow[]>()
  const push = (map: Map<string, OperaRow[]>, k: string, o: OperaRow) => { if (k) map.set(k, [...(map.get(k) ?? []), o]) }
  for (const o of operaRows) {
    push(byUuid, o.uuid, o)
    push(byFolio, o.folioOpera, o)
    push(byConcat, o.concat, o)
    push(byConf, o.confirmacion, o)
  }
  // Confirmaciones de la más larga a la más corta, para buscar el prefijo del ID ÚNICO sin confundir 123 con 1234
  const confs = [...byConf.keys()].sort((a, b) => b.length - a.length)

  const base = (f: FactoRow): Omit<FactoResult, 'status' | 'notes'> => ({
    facto: f, method: '', opera: [], factoAmount: factoAmount(f), operaTotal: 0, diff: 0, confirmacion: '', candidates: [],
  })

  const setMatch = (f: FactoRow, opera: OperaRow[], method: MatchMethod, confirmacion: string, notes: string[] = []) => {
    opera.forEach((o) => used.add(o.key))
    const pair = opera.length === 1 ? bestPair(f, operaAmounts(opera[0])) : bestPair(f, (({ ingresos, pago, pagado }) => [pago, pagado, ingresos].filter((n) => n > 0))(operaTotals(opera)))
    results.set(f.key, {
      ...base(f),
      ...pair,
      status: Math.abs(pair.diff) <= tolerance ? 'conciliada' : 'diferencia',
      method,
      opera,
      confirmacion: confirmacion || opera[0]?.confirmacion || '',
      notes,
    })
  }

  // Facto: duplicados
  const seenId = new Map<string, FactoRow[]>()
  const seenUuid = new Map<string, number>()
  for (const f of factoRows) {
    if (f.idUnico) seenId.set(f.idUnico, [...(seenId.get(f.idUnico) ?? []), f])
    if (f.uuid) seenUuid.set(f.uuid, (seenUuid.get(f.uuid) ?? 0) + 1)
  }
  // Solo importan los repetidos con reserva: los consumos sin reserva no se cruzan por ID ÚNICO
  const dupIds = [...seenId].filter(([, list]) => list.length > 1 && list.some((f) => f.reserva))
  if (dupIds.length) {
    warnings.push(`En Facto hay ${dupIds.length} ID ÚNICO repetidos con reserva (ej. ${dupIds.slice(0, 2).map(([k]) => k).join(', ')}). Revísalos: pueden ser facturas duplicadas o varias facturas de la misma reserva con el mismo monto y día.`)
  }
  const dupUuids = [...seenUuid].filter(([, n]) => n > 1)
  if (dupUuids.length) warnings.push(`En Facto hay ${dupUuids.length} folios fiscales (UUID) repetidos.`)

  for (const f of factoRows) {
    if (f.cancelada) results.set(f.key, { ...base(f), status: 'cancelada', notes: ['Factura cancelada: no se concilia'] })
    else if (f.esPago) results.set(f.key, { ...base(f), status: 'pago', notes: ['Complemento de pago (REP): no se concilia contra OPERA'] })
  }
  const active = factoRows.filter((f) => !results.has(f.key))
  const free = (list: OperaRow[] | undefined) => (list ?? []).filter((o) => !used.has(o.key))

  // Nivel 1: UUID
  for (const f of active) {
    const hit = f.uuid ? free(byUuid.get(f.uuid)) : []
    if (hit.length) setMatch(f, hit, 'UUID', '')
  }
  // Nivel 2: FISCAL_BILL_FOLIO = FOLIO_OPERA (con la misma confirmación cuando ambas existen)
  for (const f of active) {
    if (results.has(f.key) || !f.fiscalBillFolio) continue
    const hit = free(byFolio.get(f.fiscalBillFolio)).filter((o) => !f.reserva || !o.confirmacion || o.confirmacion === f.reserva)
    if (hit.length) setMatch(f, hit, 'Folio OPERA', '')
  }
  // Nivel 3: ID ÚNICO = CONCAT
  for (const f of active) {
    if (results.has(f.key) || !f.idUnico) continue
    const hit = free(byConcat.get(f.idUnico))[0]
    if (hit) setMatch(f, [hit], 'ID único = CONCAT', '')
  }

  // Nivel 4: por confirmación. Primero todos los que cuadran por monto (para que no se "roben" filas)
  const confOf = (f: FactoRow): string => {
    if (f.reserva && byConf.has(f.reserva)) return f.reserva
    // ID ÚNICO = confirmación + monto + fecha de Excel (5 dígitos): después de la confirmación tiene que quedar monto y fecha
    if (f.idUnico) return confs.find((c) => c.length >= 4 && f.idUnico.startsWith(c) && /^\d[\d.]*\d{5}$/.test(f.idUnico.slice(c.length))) ?? ''
    return ''
  }
  const pending = active.filter((f) => !results.has(f.key)).map((f) => ({ f, conf: confOf(f) }))

  for (const { f, conf } of pending) {
    if (!conf) continue
    const list = free(byConf.get(conf))
    const hit = list.find((o) => amountMatches(f, o, tolerance))
    if (hit) {
      // Las demás filas del mismo folio son el mismo cobro (cargo y pago): se enlazan juntas
      const same = hit.folioOpera ? list.filter((o) => o.folioOpera === hit.folioOpera) : [hit]
      const rest = list.length - same.length
      setMatch(f, same, 'Confirmación + monto', conf, rest > 0 ? [`La confirmación ${conf} tenía ${list.length} filas libres en OPERA; se tomó el folio ${hit.folioOpera || ''} que cuadra con el monto`.replace('folio  ', 'folio ')] : [])
    }
  }
  for (const { f, conf } of pending) {
    if (!conf || results.has(f.key)) continue
    const list = free(byConf.get(conf))
    const sum = operaRowsAmount(list)
    if (list.length > 1 && factoAmounts(f).some((a) => Math.abs(sum - a) <= tolerance)) {
      setMatch(f, list, 'Confirmación (varios folios)', conf, [`Una factura por ${list.length} folios de OPERA`])
    }
  }

  // Periodo de OPERA: lo que no cruza y cae fuera de estas fechas no se cuenta como faltante
  const range = (list: (number | null)[]) => {
    const v = list.filter((x): x is number => x != null)
    return v.length ? ([Math.min(...v), Math.max(...v)] as const) : null
  }
  const operaRange = range(operaRows.map((o) => o.fecha))
  const outside = (f: FactoRow) => !!operaRange && f.fecha != null && (f.fecha < operaRange[0] || f.fecha > operaRange[1])

  // Si la factura dice cuál es su folio de OPERA y esa fila trae otro folio, no es su pareja aunque comparta la confirmación.
  // (FISCAL_BILL_FOLIO a veces trae la reserva en lugar del folio: en ese caso no se usa para descartar.)
  const contradicts = (f: FactoRow, o: OperaRow) => !!f.fiscalBillFolio && f.fiscalBillFolio !== f.reserva && !!o.folioOpera && f.fiscalBillFolio !== o.folioOpera

  for (const { f, conf } of pending) {
    if (results.has(f.key)) continue
    const candidates = conf ? free(byConf.get(conf)) : []
    const list = candidates.filter((o) => !contradicts(f, o))
    if (list.length === 1) {
      setMatch(f, list, 'Confirmación (único folio)', conf)
    } else if (list.length > 1) {
      results.set(f.key, {
        ...base(f), status: 'ambigua', confirmacion: conf, candidates: list,
        notes: [`La confirmación ${conf} tiene ${list.length} filas en OPERA y ningún monto coincide: elegir a mano`],
      })
    } else {
      const notes: string[] = []
      const out = outside(f)
      // Sin reserva y de un centro que no es recepción: es un consumo directo (restaurante, bar…) que normalmente no pasa por un folio de OPERA
      const sinReserva = !conf && !f.reserva && !/RECEPCION/i.test(f.centro)
      if (conf && candidates.length) notes.push(`El folio ${f.fiscalBillFolio} de esta factura no está en OPERA: la confirmación ${conf} solo trae otros folios (${candidates.map((o) => o.folioOpera).join(', ')})`)
      else if (conf) notes.push(`La confirmación ${conf} existe en OPERA pero sus filas ya se usaron con otras facturas`)
      else if (sinReserva) notes.push('Sin reserva: consumo directo de un centro de consumo, normalmente no pasa por un folio de OPERA')
      else if (!f.reserva) notes.push('Factura de recepción sin reserva: debería tener una confirmación en OPERA')
      if (out) notes.push(`La factura es del ${serialToText(f.fecha)}, fuera del periodo del extracto de OPERA`)
      results.set(f.key, { ...base(f), status: out ? 'fuera-periodo' : sinReserva ? 'sin-reserva' : 'sin-opera', confirmacion: conf, diff: factoAmount(f), notes })
    }
  }

  const facto = factoRows.map((f) => results.get(f.key)).filter((r): r is FactoResult => !!r)

  // Vista desde OPERA
  const operaToFacto = new Map<string, FactoResult>()
  for (const r of facto) for (const o of r.opera) operaToFacto.set(o.key, r)
  const opera: OperaResult[] = operaRows.map((o) => {
    const r = operaToFacto.get(o.key)
    const repeated = byConf.get(o.confirmacion)?.length ?? 1
    if (r) return { opera: o, facto: r.facto, status: r.status === 'conciliada' ? 'conciliada' : 'diferencia', repeated }
    return { opera: o, facto: null, status: o.totalIngresos === 0 ? 'solo-pago' : 'sin-facto', repeated }
  })

  const duplicates: DuplicateGroup[] = [...byConf]
    .filter(([, rows]) => rows.length > 1)
    .map(([confirmacion, rows]) => ({
      confirmacion,
      rows,
      total: operaRowsAmount(rows),
      facturas: [...new Set(rows.map((o) => operaToFacto.get(o.key)?.facto.serieFolio || operaToFacto.get(o.key)?.facto.idUnico).filter(Boolean) as string[])],
    }))

  const rf = range(factoRows.map((f) => f.fecha))
  if (operaRange && rf && (operaRange[1] < rf[0] || rf[1] < operaRange[0])) {
    warnings.push(`Los periodos no se cruzan: OPERA va del ${serialToText(operaRange[0])} al ${serialToText(operaRange[1])} y Facto del ${serialToText(rf[0])} al ${serialToText(rf[1])}. Sube los dos extractos del mismo periodo.`)
  } else {
    const fuera = facto.filter((r) => r.status === 'fuera-periodo').length
    if (operaRange && fuera) {
      warnings.push(`OPERA solo trae del ${serialToText(operaRange[0])} al ${serialToText(operaRange[1])}. ${fuera} facturas de Facto de otras fechas no encontraron pareja y se marcaron "Fuera de periodo" (no cuentan como faltantes).`)
    }
  }

  const sum = (list: number[]) => round2(list.reduce((a, n) => a + n, 0))
  return {
    facto,
    opera,
    duplicates,
    warnings,
    operaRange,
    totals: {
      facto: sum(factoRows.filter((f) => !f.cancelada && !f.esPago).map(factoAmount)),
      opera: sum(operaRows.map((o) => o.totalIngresos)),
      conciliado: sum(facto.filter((r) => r.status === 'conciliada').map((r) => r.factoAmount)),
      diferencias: sum(facto.filter((r) => r.status === 'diferencia').map((r) => r.diff)),
    },
  }
}
