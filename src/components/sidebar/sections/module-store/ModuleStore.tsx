import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { fetchModuleStore, toggleModuleStore } from '../../../../core/modules/kernel.service'
import type { StoreModule } from '../../../../core/modules/kernel.service'
import { renderIcon } from '../../../../core/modules/icons'
import './ModuleStore.css'

const MOD_ICON: Record<string, string> = {
  sales:          'tag',
  cobranza:       'cash',
  shopping:       'cart',
  'cash-register':'box',
  production:     'production',
  store:          'warehouse',
  catalogos:      'catalog',
  reports:        'report',
  income:         'income',
  users:          'user',
  configurations: 'settings',
}

const fmt = (n: number, currency = 'MXN') =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n)

interface Toast { id: number; text: string; ok: boolean }

function ModCard({
  mod, toggling, currency,
  onToggle,
}: {
  mod: StoreModule
  toggling: string | null
  currency: string
  onToggle: (m: StoreModule) => void
}) {
  const isToggling = toggling === mod.moduleId
  const iconKey    = MOD_ICON[mod.moduleId] ?? 'module_store'

  return (
    <div className={`ms-card ${mod.enabled ? 'ms-card--active' : ''}`}>
      <div className="ms-card-top">
        <div className="ms-card-icon">{renderIcon(iconKey)}</div>
        <div className="ms-card-info">
          <p className="ms-card-name">{mod.name}</p>
          <p className="ms-card-desc">{mod.description}</p>
        </div>
      </div>

      <div className="ms-card-price">
        <div className="ms-price-item">
          <div className="ms-price-label">Mensual</div>
          <div className={`ms-price-value ${mod.priceMonthly === 0 ? 'ms-free' : ''}`}>
            {mod.priceMonthly === 0 ? 'Incluido' : fmt(mod.priceMonthly, currency)}
          </div>
        </div>
        <div className="ms-price-divider" />
        <div className="ms-price-item">
          <div className="ms-price-label">Anual</div>
          <div className={`ms-price-value ${mod.priceAnnual === 0 ? 'ms-free' : ''}`}>
            {mod.priceAnnual === 0 ? 'Incluido' : fmt(mod.priceAnnual, currency)}
          </div>
        </div>
      </div>

      <div className="ms-card-action">
        {mod.enabled ? (
          <button
            className="ms-btn-deactivate"
            onClick={() => onToggle(mod)}
            disabled={!!toggling}
          >
            {isToggling ? <span className="ms-spinner">⟳</span> : '✕ Desactivar'}
          </button>
        ) : (
          <button
            className="ms-btn-activate"
            onClick={() => onToggle(mod)}
            disabled={!!toggling}
          >
            {isToggling ? <span className="ms-spinner">⟳</span> : '+ Activar módulo'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function ModuleStore() {
  const activeCompanyId: number | null = useSelector((s: any) => s.user?.activeCompanyId ?? null)
  const companyIds: number[]            = useSelector((s: any) => s.user?.companyIds ?? [])
  const companyId = activeCompanyId ?? companyIds[0] ?? null

  const [modules,  setModules]  = useState<StoreModule[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [toasts,   setToasts]   = useState<Toast[]>([])

  const addToast = (text: string, ok: boolean) => {
    const id = Date.now()
    setToasts(p => [...p, { id, text, ok }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }

  const load = useCallback(async () => {
    if (!companyId) { setLoading(false); return }
    setLoading(true); setError(null)
    try { setModules(await fetchModuleStore(companyId)) }
    catch { setError('No se pudo cargar la tienda de módulos.') }
    finally { setLoading(false) }
  }, [companyId])

  useEffect(() => { load() }, [load])

  const handleToggle = async (mod: StoreModule) => {
    if (!companyId || toggling) return
    setToggling(mod.moduleId)
    const next = !mod.enabled
    try {
      await toggleModuleStore(companyId, mod.moduleId, next)
      setModules(prev => prev.map(m =>
        m.moduleId === mod.moduleId ? { ...m, enabled: next } : m
      ))
      addToast(next ? `✓ ${mod.name} activado` : `${mod.name} desactivado`, true)
    } catch {
      addToast(`Error al ${next ? 'activar' : 'desactivar'} ${mod.name}`, false)
    } finally {
      setToggling(null) }
  }

  const active    = modules.filter(m => m.enabled)
  const available = modules.filter(m => !m.enabled)
  const totalMonthly = active.reduce((s, m) => s + m.priceMonthly, 0)
  const totalAnnual  = active.reduce((s, m) => s + m.priceAnnual,  0)
  const currency     = modules[0]?.currency ?? 'MXN'
  const savings      = totalMonthly * 12 - totalAnnual

  return (
    <div className="ms-page">

      {/* Cabecera */}
      <div className="ms-header">
        <div className="ms-header-text">
          <h1>
            {renderIcon('module_store')}
            Tienda de Módulos
            <span className="ms-badge">Solo dueño</span>
          </h1>
          <p>Activa o desactiva módulos. Cada módulo activo entra en tu corte mensual o anual.</p>
        </div>
      </div>

      {/* Resumen */}
      {!loading && modules.length > 0 && (
        <div className="ms-summary">
          <div className="ms-stat">
            <div className="ms-stat-label">Módulos activos</div>
            <div className="ms-stat-value">{active.length}</div>
            <div className="ms-stat-sub">de {modules.length} disponibles</div>
          </div>
          <div className="ms-stat">
            <div className="ms-stat-label">Corte mensual</div>
            <div className="ms-stat-value">{fmt(totalMonthly, currency)}</div>
            <div className="ms-stat-sub">{currency} / mes</div>
          </div>
          <div className="ms-stat">
            <div className="ms-stat-label">Corte anual</div>
            <div className="ms-stat-value">{fmt(totalAnnual, currency)}</div>
            <div className="ms-stat-sub">
              {savings > 0 ? `Ahorras ${fmt(savings, currency)} vs mensual` : 'vs pago mensual'}
            </div>
          </div>
        </div>
      )}

      {loading && <div className="ms-loading">Cargando módulos…</div>}
      {error   && <div className="ms-error">{error}</div>}

      {!loading && !error && (
        <>
          {/* ── Sección: MIS MÓDULOS ── */}
          {active.length > 0 && (
            <section className="ms-section">
              <div className="ms-section-head ms-section-head--active">
                <span className="ms-section-dot ms-section-dot--active" />
                <h2>Mis módulos activos <span className="ms-section-count">{active.length}</span></h2>
              </div>
              <div className="ms-grid">
                {active.map(mod => (
                  <ModCard
                    key={mod.moduleId}
                    mod={mod}
                    toggling={toggling}
                    currency={currency}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Sección: DISPONIBLES ── */}
          {available.length > 0 && (
            <section className="ms-section">
              <div className="ms-section-head">
                <span className="ms-section-dot" />
                <h2>Módulos disponibles <span className="ms-section-count">{available.length}</span></h2>
              </div>
              <div className="ms-grid">
                {available.map(mod => (
                  <ModCard
                    key={mod.moduleId}
                    mod={mod}
                    toggling={toggling}
                    currency={currency}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </section>
          )}

          {active.length === 0 && available.length === 0 && (
            <div className="ms-loading">No hay módulos disponibles.</div>
          )}
        </>
      )}

      {/* Toasts */}
      {toasts.map(t => (
        <div key={t.id} className={`ms-toast ${t.ok ? 'ms-toast--ok' : 'ms-toast--err'}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
