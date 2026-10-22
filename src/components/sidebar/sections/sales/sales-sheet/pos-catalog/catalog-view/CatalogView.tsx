import React, { useCallback, useEffect, useRef, useState } from 'react'
import APIs from '../../../../../../../services/APIs'
import CatalogFilters, { CatalogFilterValues } from '../catalog-filters/CatalogFilters'
import CatalogCard, { CatalogItem } from '../catalog-card/CatalogCard'
import CatalogPager from '../catalog-pager/CatalogPager'
import '../../../../../../general/skeleton/TableSkeleton.css'
import '../catalog-card/CatalogCard.css'
import './CatalogView.css'

interface Props {
  companyId: number | null | undefined
  branchId: number | null | undefined
  /** Agregar a la ficha: la vista muestra "Agregando…" en la tarjeta hasta que termine */
  onAdd: (item: CatalogItem) => Promise<void> | void
  /** En el modal de la ficha las tarjetas son un poco más chicas */
  compact?: boolean
}

interface PageData {
  data: CatalogItem[]
  page: number
  pageSize: number
  hasMore: boolean
  total: number
  totalCapped: boolean
}

const EMPTY: CatalogFilterValues = { code: '', name: '', familyId: 0, inStock: false }
const CACHE_TTL = 30_000
const errorText = (e: any) => {
  const m = e?.response?.data?.message ?? e?.message ?? 'No se pudo cargar el catálogo.'
  return Array.isArray(m) ? m.join(', ') : String(m)
}

/**
 * Catálogo del punto de venta: filtros arriba y tarjetas paginadas. Escribir en código o nombre busca solo (con una
 * pausa corta); Enter o "Buscar" buscan al momento. Las páginas vistas se guardan unos segundos para ir y volver rápido.
 */
const CatalogView: React.FC<Props> = ({ companyId, branchId, onAdd, compact }) => {
  const [filters, setFilters] = useState<CatalogFilterValues>(EMPTY)
  const [applied, setApplied] = useState<CatalogFilterValues>(EMPTY)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [families, setFamilies] = useState<{ id: number; title: string }[]>([])
  const [addingId, setAddingId] = useState<number | null>(null)
  const typing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const abort = useRef<AbortController | undefined>(undefined)
  const cache = useRef(new Map<string, { at: number; value: PageData }>())
  const top = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    APIs.getPosCatalogFamilies(companyId ?? undefined)
      .then((r: any) => alive && setFamilies(Array.isArray(r?.data) ? r.data : []))
      .catch(() => alive && setFamilies([]))
    return () => {
      alive = false
    }
  }, [companyId])

  // Pedir la página con los filtros aplicados
  useEffect(() => {
    if (!branchId) return
    const key = JSON.stringify([companyId, branchId, applied, page])
    const hit = cache.current.get(key)
    if (hit && Date.now() - hit.at < CACHE_TTL) {
      setResult(hit.value)
      setLoading(false)
      setError('')
      return
    }
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setLoading(true)
    setError('')
    APIs.getPosCatalog(
      {
        companyId: companyId ?? undefined,
        branchId,
        code: applied.code.trim(),
        name: applied.name.trim(),
        familyId: applied.familyId,
        inStock: applied.inStock,
        page,
        pageSize: compact ? 18 : 24,
      },
      ctrl.signal,
    )
      .then((r: any) => {
        if (ctrl.signal.aborted) return
        const value: PageData = {
          data: r?.data ?? [],
          page: r?.page ?? page,
          pageSize: r?.pageSize ?? 24,
          hasMore: !!r?.hasMore,
          total: Number(r?.total ?? 0),
          totalCapped: !!r?.totalCapped,
        }
        cache.current.set(key, { at: Date.now(), value })
        setResult(value)
      })
      .catch((e) => {
        if (!ctrl.signal.aborted) setError(errorText(e))
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [companyId, branchId, applied, page, compact])

  const apply = useCallback((next: CatalogFilterValues) => {
    if (typing.current) clearTimeout(typing.current)
    setApplied(next)
    setPage(1)
  }, [])

  const change = (patch: Partial<CatalogFilterValues>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    // Familia y existencia buscan al momento; lo que se escribe espera a que dejes de teclear
    if ('familyId' in patch || 'inStock' in patch) apply(next)
    else {
      if (typing.current) clearTimeout(typing.current)
      typing.current = setTimeout(() => apply(next), 350)
    }
  }

  const goTo = (p: number) => {
    setPage(Math.max(1, p))
    top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const add = async (item: CatalogItem) => {
    if (addingId != null) return
    setAddingId(item.id)
    try {
      await onAdd(item)
    } finally {
      setAddingId(null)
    }
  }

  const items = result?.data ?? []
  const filtered = applied.code || applied.name || applied.familyId || applied.inStock

  return (
    <div className={`catalog-view ${compact ? 'catalog-view--compact' : ''}`} ref={top}>
      <CatalogFilters values={filters} families={families} onChange={change} onSearch={() => apply({ ...filters })} searching={loading} />

      {!branchId ? (
        <div className='catalog-view__state'>
          <span className='material-symbols-rounded' aria-hidden>store</span>
          <strong>Elige una sucursal</strong>
          <p>El catálogo muestra los artículos y precios de la sucursal donde vendes.</p>
        </div>
      ) : error ? (
        <div className='catalog-view__state is-error' role='alert'>
          <span className='material-symbols-rounded' aria-hidden>error</span>
          <strong>No se pudo cargar el catálogo</strong>
          <p>{error}</p>
          <button type='button' onClick={() => setApplied({ ...applied })}>Reintentar</button>
        </div>
      ) : loading && !items.length ? (
        <div className='catalog-view__grid' aria-busy='true'>
          {Array.from({ length: compact ? 8 : 12 }).map((_, i) => (
            <div key={i} className='catalog-card catalog-card--skeleton' aria-hidden>
              <span className='catalog-card__media'>
                <span className='table-skeleton__shimmer catalog-card__frame' />
              </span>
              <div className='catalog-card__body'>
                <span className='table-skeleton__shimmer catalog-card__line' style={{ width: '40%' }} />
                <span className='table-skeleton__shimmer catalog-card__line' style={{ width: '85%' }} />
                <span className='table-skeleton__shimmer catalog-card__line' style={{ width: '60%' }} />
                <span className='table-skeleton__shimmer catalog-card__line' style={{ height: 36, marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : !items.length ? (
        <div className='catalog-view__state'>
          <span className='material-symbols-rounded' aria-hidden>{filtered ? 'search_off' : 'inventory_2'}</span>
          <strong>{filtered ? 'Nada coincide con tu búsqueda' : 'Aún no hay artículos en esta sucursal'}</strong>
          <p>{filtered ? 'Prueba con otro nombre o código, o quita algún filtro.' : 'Da de alta artículos en Catálogos › Artículos y actívalos en esta sucursal.'}</p>
          {filtered ? (
            <button
              type='button'
              onClick={() => {
                setFilters(EMPTY)
                apply(EMPTY)
              }}
            >
              Quitar filtros
            </button>
          ) : null}
        </div>
      ) : (
        <div className={`catalog-view__grid ${loading ? 'is-loading' : ''}`}>
          {items.map((item) => (
            <CatalogCard key={item.id} item={item} adding={addingId === item.id} onAdd={add} />
          ))}
        </div>
      )}

      {result && items.length ? (
        <CatalogPager
          page={result.page}
          pageSize={result.pageSize}
          shown={items.length}
          hasMore={result.hasMore}
          total={result.total}
          totalCapped={result.totalCapped}
          loading={loading}
          onPage={goTo}
        />
      ) : null}
    </div>
  )
}

export default CatalogView
