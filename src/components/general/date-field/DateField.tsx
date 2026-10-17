import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './DateField.css'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** AAAA-MM-DD ↔ fecha local (sin zona horaria: la columna es DATE). */
const parse = (value?: string | null): Date | null => {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && toIso(a) === toIso(b)
const addMonths = (d: Date, n: number) => {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1)
  r.setDate(Math.min(d.getDate(), new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()))
  return r
}
const startOfToday = () => {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}

export interface DatePreset {
  label: string
  /** Meses a sumar a hoy (ej. 6 = dentro de 6 meses). */
  months: number
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Clase del botón que hace de campo, para que se vea igual que los demás inputs del formulario. */
  className?: string
  'aria-label'?: string
  /** No permite elegir días antes de esta fecha (AAAA-MM-DD). */
  min?: string
  /** Atajos debajo del calendario (ej. "6 meses", "1 año"). */
  presets?: DatePreset[]
  /** Colorea el campo según cuánto falta (vencido / pronto): pensado para caducidades. */
  expiryTone?: boolean
}

/**
 * Selector de fecha propio de Fixora: mismo look que el resto del sistema (claro/oscuro), semana de lunes a domingo,
 * meses en español, atajos opcionales. En celular se abre como hoja desde abajo; en escritorio, flotando junto al campo.
 */
const DateField: React.FC<Props> = ({ value, onChange, placeholder = 'dd/mm/aaaa', className = '', min, presets, expiryTone, ...rest }) => {
  const selected = parse(value)
  const minDate = parse(min)
  const today = startOfToday()

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<Date>(() => selected ?? today)
  const [picking, setPicking] = useState<'days' | 'months'>('days')
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const [isPhone, setIsPhone] = useState(() => window.matchMedia('(max-width: 560px)').matches)

  const openPicker = () => {
    setView(selected ?? today)
    setPicking('days')
    setIsPhone(window.matchMedia('(max-width: 560px)').matches)
    setOpen(true)
  }

  // Escritorio: se coloca debajo del campo (o arriba si no cabe), siempre dentro de la ventana
  useLayoutEffect(() => {
    if (!open || isPhone || !triggerRef.current) return
    const place = () => {
      const r = triggerRef.current!.getBoundingClientRect()
      const w = popRef.current?.offsetWidth ?? 300
      const h = popRef.current?.offsetHeight ?? 360
      const below = r.bottom + 6 + h <= window.innerHeight
      setPos({
        top: below ? r.bottom + 6 : Math.max(8, r.top - h - 6),
        left: Math.min(Math.max(8, r.left), window.innerWidth - w - 8),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, isPhone, picking])

  // Clic fuera o Escape cierran
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!popRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // 6 semanas fijas para que el calendario no brinque de alto entre meses
  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7 // lunes = 0
    return Array.from({ length: 42 }, (_, i) => new Date(view.getFullYear(), view.getMonth(), 1 - offset + i))
  }, [view])

  const pick = (d: Date) => {
    if (minDate && d < minDate) return
    onChange(toIso(d))
    setOpen(false)
    triggerRef.current?.focus()
  }

  const daysLeft = selected ? Math.round((selected.getTime() - today.getTime()) / 86_400_000) : null
  const tone = !expiryTone || daysLeft == null ? '' : daysLeft < 0 ? 'is-expired' : daysLeft <= 30 ? 'is-soon' : 'is-ok'
  const display = selected ? `${String(selected.getDate()).padStart(2, '0')}/${String(selected.getMonth() + 1).padStart(2, '0')}/${selected.getFullYear()}` : ''

  const popover = open && (
    <>
      {isPhone && <div className='dfield__backdrop' />}
      <div
        ref={popRef}
        className={`dfield__pop ${isPhone ? 'dfield__pop--sheet' : ''}`}
        style={!isPhone ? { top: pos?.top ?? -9999, left: pos?.left ?? -9999 } : undefined}
        role='dialog'
        aria-label='Elegir fecha'
      >
        {isPhone && <div className='dfield__grabber' aria-hidden />}
        <div className='dfield__head'>
          <button type='button' className='dfield__nav' onClick={() => setView(addMonths(view, picking === 'days' ? -1 : -12))} aria-label='Anterior'>
            <span className='material-symbols-rounded'>chevron_left</span>
          </button>
          <button type='button' className='dfield__title' onClick={() => setPicking(picking === 'days' ? 'months' : 'days')}>
            {picking === 'days' ? `${MONTHS[view.getMonth()]} ${view.getFullYear()}` : view.getFullYear()}
            <span className='material-symbols-rounded'>{picking === 'days' ? 'expand_more' : 'expand_less'}</span>
          </button>
          <button type='button' className='dfield__nav' onClick={() => setView(addMonths(view, picking === 'days' ? 1 : 12))} aria-label='Siguiente'>
            <span className='material-symbols-rounded'>chevron_right</span>
          </button>
        </div>

        {picking === 'days' ? (
          <div className='dfield__days' key={`${view.getFullYear()}-${view.getMonth()}`}>
            {WEEKDAYS.map((w, i) => (
              <span key={i} className='dfield__weekday'>{w}</span>
            ))}
            {days.map((d) => {
              const outside = d.getMonth() !== view.getMonth()
              const disabled = !!minDate && d < minDate
              const cls = [
                'dfield__day',
                outside && 'is-outside',
                sameDay(d, today) && 'is-today',
                sameDay(d, selected) && 'is-selected',
                expiryTone && d < today && 'is-past',
              ].filter(Boolean).join(' ')
              return (
                <button key={toIso(d)} type='button' className={cls} disabled={disabled} onClick={() => pick(d)} aria-label={toIso(d)} aria-pressed={sameDay(d, selected)}>
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        ) : (
          <div className='dfield__months'>
            {MONTHS.map((m, i) => (
              <button
                key={m}
                type='button'
                className={`dfield__month ${selected && selected.getMonth() === i && selected.getFullYear() === view.getFullYear() ? 'is-selected' : ''}`}
                onClick={() => {
                  setView(new Date(view.getFullYear(), i, 1))
                  setPicking('days')
                }}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
        )}

        {presets?.length ? (
          <div className='dfield__presets'>
            {presets.map((p) => (
              <button key={p.label} type='button' className='dfield__chip' onClick={() => pick(addMonths(today, p.months))}>
                {p.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className='dfield__foot'>
          <button type='button' className='dfield__link' onClick={() => { onChange(''); setOpen(false) }} disabled={!value}>
            Borrar
          </button>
          <button type='button' className='dfield__link dfield__link--strong' onClick={() => pick(today)} disabled={!!minDate && today < minDate}>
            Hoy
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        className={`dfield ${className} ${tone} ${!display ? 'is-empty' : ''}`}
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup='dialog'
        aria-expanded={open}
        {...rest}
      >
        <span className='dfield__value'>{display || placeholder}</span>
        <span className='material-symbols-rounded dfield__icon' aria-hidden>calendar_month</span>
      </button>
      {popover && createPortal(popover, document.body)}
    </>
  )
}

export default DateField
