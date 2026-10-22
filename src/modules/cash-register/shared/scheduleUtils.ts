/** Utilidades de horarios de turno (Horarios, Rotaciones, Asignaciones). Días: 0 = domingo … 6 = sábado. */
export const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const DAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
/** Orden de la semana en pantalla: lunes a domingo. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export const SCHEDULE_COLORS = ['#072a57', '#fc7400', '#1f9d55', '#2563eb', '#a855f7', '#d64545', '#0891b2', '#64748b']

export const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** '06:00' → '6:00 a. m.' (se guardan en 24 h y se muestran en 12 h). */
export const fmt12 = (t?: string | null) => {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return t ?? ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`
}

export const fmtRange = (a?: string | null, b?: string | null) => `${fmt12(a)} – ${fmt12(b)}`

export const crossesMidnight = (s: { startTime: string; endTime: string }) => toMinutes(s.endTime) <= toMinutes(s.startTime)

/** Días en texto corto: "Lun a Vie", "Todos los días" o "Lun, Mié, Vie". */
export const daysText = (days: number[]) => {
  const set = new Set(days)
  if (set.size === 7) return 'Todos los días'
  const ordered = WEEK_ORDER.filter((d) => set.has(d))
  const isRun = ordered.length > 2 && ordered.every((d, i) => i === 0 || WEEK_ORDER.indexOf(d) === WEEK_ORDER.indexOf(ordered[i - 1]) + 1)
  return isRun ? `${DAYS_SHORT[ordered[0]]} a ${DAYS_SHORT[ordered[ordered.length - 1]]}` : ordered.map((d) => DAYS_SHORT[d]).join(', ')
}

/** Tramos de un horario en la semana: [día, minuto inicio, minuto fin]; si cruza la medianoche se parte en dos días. */
export const segmentsOf = (s: { startTime: string; endTime: string; days: number[] }): [number, number, number][] => {
  const a = toMinutes(s.startTime)
  const b = toMinutes(s.endTime)
  const out: [number, number, number][] = []
  for (const d of s.days) {
    if (b > a) out.push([d, a, b])
    else {
      out.push([d, a, 1440])
      if (b > 0) out.push([(d + 1) % 7, 0, b])
    }
  }
  return out
}
