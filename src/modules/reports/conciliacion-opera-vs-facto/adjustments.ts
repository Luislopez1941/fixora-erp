/**
 * Ajustes manuales de la conciliación: lo que el usuario resuelve a mano cuando el cruce automático no alcanza
 * (vincular una factura con filas de OPERA, aclarar una diferencia con su motivo o excluir un registro).
 *
 * Los ajustes se guardan aparte (ver adjustmentsApi.ts) y se aplican encima del resultado automático cada vez que se
 * analiza un archivo. Cada registro se identifica con una llave estable (UUID, CONCAT, folio…), no con el número de
 * fila, para que al volver a subir el archivo del mismo periodo los ajustes se vuelvan a aplicar solos.
 */
import { operaTotals, type FactoResult, type FactoRow, type OperaResult, type OperaRow, type Reconciliation } from './reconcile'

export type AdjustmentKind = 'vincular' | 'aclarar' | 'excluir'

export const ADJ_KIND_LABEL: Record<AdjustmentKind, string> = {
  vincular: 'Vínculo manual',
  aclarar: 'Aclarada',
  excluir: 'Excluida',
}

export const ADJ_REASONS = [
  { key: 'vinculo-manual', label: 'Vínculo manual' },
  { key: 'factura-manual', label: 'Factura manual (fuera de OPERA)' },
  { key: 'propina', label: 'Propina o cargo no facturado' },
  { key: 'refactura', label: 'Refacturación o sustitución de CFDI' },
  { key: 'cxc', label: 'Pago parcial o cuenta por cobrar (CXC)' },
  { key: 'saneamiento', label: 'Saneamiento ambiental' },
  { key: 'tipo-cambio', label: 'Tipo de cambio' },
  { key: 'otro-periodo', label: 'Corresponde a otro periodo' },
  { key: 'duplicado', label: 'Registro duplicado' },
  { key: 'otro', label: 'Otro (explicar en la nota)' },
] as const

export type AdjReason = (typeof ADJ_REASONS)[number]['key']
export const reasonLabel = (key: string) => ADJ_REASONS.find((r) => r.key === key)?.label ?? key

export interface Adjustment {
  id: string
  side: 'facto' | 'opera'
  /** Llave estable del registro ajustado (ver factoKey / operaKey). */
  key: string
  /** Cómo se muestra el registro (ej. "FD-24755" o "Folio 526113"). */
  ref: string
  kind: AdjustmentKind
  reason: AdjReason
  note: string
  /** Solo en vínculos: llaves de las filas de OPERA unidas a la factura. */
  links: string[]
  user: string
  createdAt: string
}

export type AdjustmentInput = Omit<Adjustment, 'id' | 'createdAt'>

const round2 = (n: number) => Math.round(n * 100) / 100

/** Llave estable de una factura: el UUID es único; si no hay, el ID ÚNICO o la serie-folio. */
export const factoKey = (f: FactoRow) => `F:${f.uuid || f.idUnico || f.serieFolio || `fila-${f.excelRow}`}`

/**
 * Llave estable de una fila de OPERA. El UUID no sirve solo (un mismo folio puede venir en dos filas con la misma factura),
 * así que se combina folio, CONCAT, montos y fecha. El número de fila no se usa porque cambia al volver a exportar.
 */
export const operaKey = (o: OperaRow) => `O:${[o.folioOpera, o.concat, o.confirmacion, o.fecha ?? '', o.totalIngresos, o.totalPago].join('|')}`

export const factoRef = (f: FactoRow) => f.serieFolio || f.idUnico || `Fila ${f.excelRow}`
export const operaRef = (o: OperaRow) => `Folio ${o.folioOpera || '—'} · conf. ${o.confirmacion || '—'}`

/** El total de OPERA más cercano al monto de la factura (pago, pagado o ingresos), sin repetir folios. */
export function compareWithOpera(factoAmount: number, rows: OperaRow[]) {
  if (!rows.length) return { operaTotal: 0, diff: round2(factoAmount) }
  const t = operaTotals(rows)
  const options = [t.pago, t.pagado, t.ingresos].filter((n) => n > 0)
  const operaTotal = options.length ? options.reduce((best, n) => (Math.abs(factoAmount - n) < Math.abs(factoAmount - best) ? n : best)) : 0
  return { operaTotal, diff: round2(factoAmount - operaTotal) }
}

export interface AppliedReconciliation extends Reconciliation {
  /** Ajustes guardados cuyo registro no está en el archivo cargado (por ejemplo, de otro periodo). */
  orphans: Adjustment[]
}

const freeStatus = (o: OperaRow): OperaResult['status'] => (o.totalIngresos === 0 ? 'solo-pago' : 'sin-facto')

/**
 * Aplica los ajustes encima del resultado automático. No modifica `rec`: devuelve copias.
 * Un vínculo manual solo queda "Ajustada" si el monto cuadra (dentro de la tolerancia) o si la diferencia se explicó con un
 * motivo; si no, sigue "Con diferencia" para que no se pierda de vista.
 */
export function applyAdjustments(rec: Reconciliation, adjustments: Adjustment[], tolerance = 1): AppliedReconciliation {
  const facto: FactoResult[] = rec.facto.map((r) => ({ ...r, opera: [...r.opera], notes: [...r.notes] }))
  const opera: OperaResult[] = rec.opera.map((r) => ({ ...r }))
  const factoByKey = new Map<string, FactoResult[]>()
  for (const r of facto) factoByKey.set(factoKey(r.facto), [...(factoByKey.get(factoKey(r.facto)) ?? []), r])
  const operaByKey = new Map<string, OperaResult[]>()
  for (const r of opera) operaByKey.set(operaKey(r.opera), [...(operaByKey.get(operaKey(r.opera)) ?? []), r])
  const operaResultOf = new Map<string, OperaResult>(opera.map((r) => [r.opera.key, r]))
  const orphans: Adjustment[] = []

  const ordered = [...adjustments].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  for (const adj of ordered) {
    if (adj.side === 'facto') {
      const targets = factoByKey.get(adj.key)
      if (!targets?.length) { orphans.push(adj); continue }
      for (const r of targets) {
        r.prevStatus = r.prevStatus ?? r.status
        r.adjustment = adj
        if (adj.kind === 'vincular') {
          const rows = adj.links.flatMap((k) => operaByKey.get(k) ?? []).map((x) => x.opera)
          // Las filas que el cruce automático le había dado y ya no están en el vínculo quedan libres
          for (const prev of r.opera) {
            if (rows.some((x) => x.key === prev.key)) continue
            const pr = operaResultOf.get(prev.key)
            if (pr && pr.facto === r.facto) { pr.facto = null; pr.status = freeStatus(prev) }
          }
          // Si otra factura tenía alguna de estas filas, se la quita (una fila de OPERA va con una sola factura)
          for (const other of facto) {
            if (other === r || !other.opera.some((x) => rows.some((y) => y.key === x.key))) continue
            other.opera = other.opera.filter((x) => !rows.some((y) => y.key === x.key))
            other.notes.push(`Una de sus filas de OPERA se vinculó a mano a ${factoRef(r.facto)}`)
            if (!other.opera.length && other.status !== 'ajustada' && other.status !== 'excluida') {
              other.prevStatus = other.prevStatus ?? other.status
              other.status = 'sin-opera'
              other.operaTotal = 0
              other.diff = other.factoAmount
            }
          }
          const cmp = compareWithOpera(r.factoAmount, rows)
          r.opera = rows
          r.operaTotal = cmp.operaTotal
          r.diff = cmp.diff
          r.method = 'Manual'
          r.candidates = []
          const resolved = Math.abs(cmp.diff) <= tolerance || adj.reason !== 'vinculo-manual'
          r.status = resolved ? 'ajustada' : 'diferencia'
          for (const o of rows) {
            const or = operaResultOf.get(o.key)
            if (!or) continue
            or.prevStatus = or.prevStatus ?? or.status
            or.facto = r.facto
            or.status = resolved ? 'ajustada' : 'diferencia'
            or.adjustment = adj
          }
        } else {
          r.status = adj.kind === 'excluir' ? 'excluida' : 'ajustada'
        }
      }
    } else {
      const targets = operaByKey.get(adj.key)
      if (!targets?.length) { orphans.push(adj); continue }
      for (const r of targets) {
        r.prevStatus = r.prevStatus ?? r.status
        r.adjustment = adj
        r.status = adj.kind === 'excluir' ? 'excluida' : 'ajustada'
      }
    }
  }

  return { ...rec, facto, opera, orphans }
}
