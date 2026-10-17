import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PrivateRoutes } from '../../models/routes'
import { useModules } from '../../core/modules/useModules'
import { renderIcon } from '../../core/modules/icons'
import type { ModuleManifest } from '../../core/modules/module.types'
import './OptionsMenu.css'

const buildPath = (path?: string) => (path ? `/${PrivateRoutes.PRIVATE}/${path}` : `/${PrivateRoutes.PRIVATE}`)

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const Chevron = (
  <svg className='opt__chevron' xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden>
    <path d='M9 6l6 6l-6 6' />
  </svg>
)

/**
 * Menú de módulos para celular: los mismos módulos y permisos que el menú lateral (se arma con useModules), en un
 * cuadro de accesos con buscador. Se navega entrando de pantalla en pantalla, siempre en tarjetas:
 * módulos → grupos del módulo (Punto de venta, Cobros…) → pantallas del grupo. Un módulo con un solo grupo salta
 * directo a sus pantallas; uno simple entra directo. El nivel vive en la URL (?m=&g=), así el "atrás" del celular regresa.
 */
const OptionsMenu: React.FC = () => {
  const { modules } = useModules()
  const [query, setQuery] = useState('')
  const [params, setParams] = useSearchParams()

  const opened: ModuleManifest | undefined = modules.find((m) => m.key === params.get('m') && m.children?.length)

  // Grupos del módulo abierto en su orden (sin grupo = "General")
  const groups = useMemo(() => {
    const list: { label: string; count: number }[] = []
    for (const child of opened?.children ?? []) {
      const label = child.group ?? 'General'
      const found = list.find((g) => g.label === label)
      if (found) found.count++
      else list.push({ label, count: 1 })
    }
    return list
  }, [opened])
  const useGroups = groups.length > 1
  const openGroup = useGroups ? groups.find((g) => g.label === params.get('g'))?.label ?? null : null
  const screens = (opened?.children ?? []).filter((c) => !useGroups || (c.group ?? 'General') === openGroup)

  const go = (next: { m?: string; g?: string }) => {
    const p = new URLSearchParams()
    if (next.m) p.set('m', next.m)
    if (next.g) p.set('g', next.g)
    setParams(p)
    setQuery('')
    window.scrollTo({ top: 0 })
  }
  const back = () => (openGroup ? go({ m: opened!.key }) : go({}))

  // Búsqueda: cada sección (y cada módulo simple) con el módulo al que pertenece
  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []
    const rows: { key: string; label: string; module: string; icon: string; path?: string }[] = []
    for (const mod of modules) {
      if (mod.children?.length) {
        for (const child of mod.children) {
          if (normalize(`${child.label} ${child.group ?? ''} ${mod.label}`).includes(q)) {
            rows.push({ key: `${mod.key}:${child.path}`, label: child.label, module: child.group ? `${mod.label} › ${child.group}` : mod.label, icon: mod.icon, path: child.path })
          }
        }
      } else if (normalize(mod.label).includes(q)) {
        rows.push({ key: mod.key, label: mod.label, module: 'Acceso directo', icon: mod.icon, path: mod.path })
      }
    }
    return rows
  }, [modules, query])

  const searching = query.trim().length > 0
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

  const title = openGroup ?? opened?.label ?? 'Menú'
  const crumb = openGroup ? opened!.label : opened ? 'Menú' : null

  return (
    <div className='opt'>
      <div className='opt__top'>
        <div className='opt__heading'>
          {opened && (
            <button type='button' className='opt__back' onClick={back} aria-label={`Regresar a ${crumb}`}>
              <span className='material-symbols-rounded'>arrow_back</span>
            </button>
          )}
          <div className='opt__heading-text'>
            {crumb && <small className='opt__crumb'>{crumb}</small>}
            <h2 className='opt__title'>{title}</h2>
          </div>
          {opened && <span className='opt__tile-icon opt__tile-icon--sm'>{renderIcon(opened.icon)}</span>}
        </div>
        <div className='opt__search'>
          <span className='material-symbols-rounded' aria-hidden>search</span>
          <input
            type='search'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Buscar una sección…'
            aria-label='Buscar una sección'
            autoComplete='off'
          />
          {query && (
            <button type='button' className='opt__clear' onClick={() => setQuery('')} aria-label='Borrar búsqueda'>
              <span className='material-symbols-rounded'>close</span>
            </button>
          )}
        </div>
      </div>

      {searching ? (
        <div className='opt__results'>
          {results.length > 0 ? (
            results.map((row) => (
              <Link key={row.key} to={buildPath(row.path)} className='opt__row'>
                <span className='opt__row-icon'>{renderIcon(row.icon)}</span>
                <span className='opt__row-text'>
                  <strong>{row.label}</strong>
                  <small>{row.module}</small>
                </span>
                {Chevron}
              </Link>
            ))
          ) : (
            <p className='opt__empty'>No hay secciones que coincidan con “{query.trim()}”.</p>
          )}
        </div>
      ) : !opened ? (
        <div className='opt__grid' key='modules'>
          {modules.map((mod) => {
            const n = mod.children?.length ?? 0
            const content = (
              <>
                <span className='opt__tile-icon'>{renderIcon(mod.icon)}</span>
                <span className='opt__tile-label'>{mod.label}</span>
                <small className='opt__tile-hint'>{n > 0 ? count(n, 'sección', 'secciones') : 'Acceso directo'}</small>
              </>
            )
            return n > 0 ? (
              <button key={mod.key} type='button' className='opt__tile' onClick={() => go({ m: mod.key })}>
                {content}
              </button>
            ) : (
              <Link key={mod.key} to={buildPath(mod.path)} className='opt__tile'>
                {content}
              </Link>
            )
          })}
        </div>
      ) : useGroups && !openGroup ? (
        <div className='opt__grid opt__grid--enter' key={`groups:${opened.key}`}>
          {groups.map((group) => (
            <button key={group.label} type='button' className='opt__tile' onClick={() => go({ m: opened.key, g: group.label })}>
              <span className='opt__tile-icon'>{renderIcon(opened.icon)}</span>
              <span className='opt__tile-label'>{group.label}</span>
              <small className='opt__tile-hint'>{count(group.count, 'pantalla', 'pantallas')}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className='opt__grid opt__grid--enter' key={`screens:${opened.key}:${openGroup ?? ''}`}>
          {screens.map((child) => (
            <Link key={child.path} to={buildPath(child.path)} className={`opt__tile ${child.placeholder ? 'is-soon' : ''}`}>
              <span className='opt__tile-icon'>{renderIcon(opened.icon)}</span>
              <span className='opt__tile-label'>{child.label}</span>
              {child.placeholder && <small className='opt__tile-hint'>En construcción</small>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default OptionsMenu
