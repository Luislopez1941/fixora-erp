import React from 'react'
import { AxisOption, TemplateAxis, displayValue, money, toNumber } from '../../variantTypes'
import './PriceAdjust.css'

interface Props {
  axis: Pick<TemplateAxis, 'name' | 'type' | 'unit'>
  options: AxisOption[]
  onChange: (options: AxisOption[]) => void
  /** Precio del artículo: si viene, se muestra cómo queda cada valor ("= $120") */
  basePrice?: number | null
}

/**
 * "Ajustar precio según este valor": junto a cada valor un monto (+$20) o porcentaje (+10%).
 * Lo usan la plantilla (ajustes sugeridos) y el asistente del artículo (ajustes de ese artículo).
 */
const PriceAdjust: React.FC<Props> = ({ axis, options, onChange, basePrice }) => {
  const patch = (i: number, p: Partial<AxisOption>) => onChange(options.map((o, j) => (j === i ? { ...o, ...p } : o)))
  return (
    <div className='price-adjust'>
      <p className='price-adjust__help'>
        Cuánto sube o baja (−) el precio con cada {axis.name.trim().toLowerCase() || 'valor'}.
      </p>
      <ul className='price-adjust__list'>
        {options.map((o, i) => {
          const percent = o.adjustType === 'PERCENT'
          const preview = basePrice != null && o.adjust ? basePrice + (percent ? (basePrice * o.adjust) / 100 : o.adjust) : null
          return (
            <li key={o.value}>
              <span className='price-adjust__value'>
                {o.hex ? <i style={{ background: o.hex }} aria-hidden /> : null}
                {displayValue(axis, o.value)}
              </span>
              <span className='price-adjust__field'>
                <span className='price-adjust__sign' aria-hidden>{percent ? '' : '+$'}</span>
                <input
                  type='number'
                  step='any'
                  inputMode='decimal'
                  value={o.adjust ?? ''}
                  placeholder='0'
                  onChange={(e) => {
                    const n = toNumber(e.target.value)
                    patch(i, { adjust: e.target.value.trim() === '' || !Number.isFinite(n) ? undefined : n })
                  }}
                  aria-label={`Ajuste de precio de ${o.value}`}
                />
                {percent ? <span className='price-adjust__sign' aria-hidden>%</span> : null}
              </span>
              <span className='price-adjust__mode' role='radiogroup' aria-label={`Tipo de ajuste de ${o.value}`}>
                <button type='button' role='radio' aria-checked={!percent} className={!percent ? 'is-active' : ''} onClick={() => patch(i, { adjustType: undefined })}>$</button>
                <button type='button' role='radio' aria-checked={percent} className={percent ? 'is-active' : ''} onClick={() => patch(i, { adjustType: 'PERCENT' })}>%</button>
              </span>
              {basePrice != null ? <small className='price-adjust__preview'>{money(Math.max(0, preview ?? basePrice))}</small> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default PriceAdjust
