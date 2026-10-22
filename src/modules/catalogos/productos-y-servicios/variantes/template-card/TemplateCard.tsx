import React from 'react'
import { AXIS_TYPE_LABEL, VariantTemplate, displayValue, formulaText } from '../variantTypes'
import './TemplateCard.css'

interface Props {
  template: VariantTemplate
  busy: boolean
  canManage: boolean
  onEdit: () => void
  onDuplicate: () => void
  onToggle: () => void
  onDelete: () => void
  /** Recalcular los precios de sus artículos (solo si la plantilla calcula precios y tiene artículos) */
  onRecalc?: () => void
}

/** Tarjeta de una plantilla: sus ejes con algunos valores, cuántos artículos y categorías la usan, y acciones. */
const TemplateCard: React.FC<Props> = ({ template: t, busy, canManage, onEdit, onDuplicate, onToggle, onDelete, onRecalc }) => {
  const inUse = (t.itemsCount ?? 0) + (t.categoriesCount ?? 0) > 0
  const deleteHint = t.systemKey ? 'Las plantillas del sistema no se borran' : inUse ? 'Está en uso: desactívala o cámbiala en sus artículos' : 'Eliminar'
  return (
    <article className={`template-card ${t.active ? '' : 'is-inactive'} ${busy ? 'is-busy' : ''}`}>
      <header className='template-card__head'>
        <div>
          <strong>{t.name}</strong>
          <span className='template-card__tags'>
            {t.systemKey ? <em className='template-card__tag'>Del sistema</em> : null}
            {!t.active ? <em className='template-card__tag is-off'>Inactiva</em> : null}
          </span>
        </div>
        <small>{t.itemsCount ?? 0} artículo{t.itemsCount === 1 ? '' : 's'} · {t.categoriesCount ?? 0} categoría{t.categoriesCount === 1 ? '' : 's'}</small>
      </header>

      {t.axes.length ? (
        <ul className='template-card__axes'>
          {t.axes.map((a) => (
            <li key={a.position}>
              <span className='template-card__axis'>
                <b>{a.name}</b>
                <small>{AXIS_TYPE_LABEL[a.type]}{a.type === 'MEASURE' && a.unit ? ` · ${a.unit}` : ''}</small>
              </span>
              <span className='template-card__values'>
                {(a.type === 'TEXT' || a.type === 'NUMBER' || a.type === 'MEASURE') && !a.options.length ? (
                  <small>{a.type === 'TEXT' ? 'Valores libres' : `Cualquier valor${a.minValue != null ? ` desde ${a.minValue}` : ''}${a.maxValue != null ? ` hasta ${a.maxValue}` : ''}`}</small>
                ) : (
                  <>
                    {a.options.slice(0, 8).map((o) => (
                      <span key={o.value} className='template-card__value'>
                        {a.type === 'COLOR' ? <i style={{ background: o.hex }} aria-hidden /> : null}
                        {displayValue(a, o.value)}
                      </span>
                    ))}
                    {a.options.length > 8 ? <small>+{a.options.length - 8}</small> : null}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className='template-card__simple'>No crea variantes: los artículos con esta plantilla son simples.</p>
      )}

      {t.fields?.length ? (
        <p className='template-card__fields'>
          <span className='material-symbols-rounded' aria-hidden>description</span>
          <span>
            Datos del artículo: <b>{t.fields.map((f) => f.name).join(', ')}</b>
          </span>
        </p>
      ) : null}

      {t.priceFormula?.length ? (
        <p className='template-card__rule'>
          <span className='material-symbols-rounded' aria-hidden>calculate</span>
          Precio = {formulaText(t.priceFormula)}
        </p>
      ) : null}

      {canManage ? (
        <footer className='template-card__actions'>
          <button type='button' onClick={onEdit} disabled={busy}>
            <span className='material-symbols-rounded' aria-hidden>edit</span> Editar
          </button>
          {onRecalc && (t.itemsCount ?? 0) > 0 && (t.priceFormula?.length || t.axes.some((a) => a.options.some((o) => o.adjust))) ? (
            <button type='button' onClick={onRecalc} disabled={busy} aria-label={`Recalcular precios de ${t.name}`} title='Recalcular precios de sus artículos'>
              <span className='material-symbols-rounded'>sync</span>
            </button>
          ) : null}
          <button type='button' onClick={onDuplicate} disabled={busy} aria-label={`Duplicar ${t.name}`} title='Duplicar'>
            <span className='material-symbols-rounded'>content_copy</span>
          </button>
          <button type='button' onClick={onToggle} disabled={busy} aria-label={t.active ? 'Desactivar' : 'Activar'} title={t.active ? 'Desactivar' : 'Activar'}>
            <span className='material-symbols-rounded'>{t.active ? 'toggle_on' : 'toggle_off'}</span>
          </button>
          <button type='button' className='is-danger' onClick={onDelete} disabled={busy || !!t.systemKey || inUse} aria-label={`Eliminar ${t.name}`} title={deleteHint}>
            <span className='material-symbols-rounded'>delete</span>
          </button>
        </footer>
      ) : null}
    </article>
  )
}

export default TemplateCard
