import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import Swal from 'sweetalert2'
import APIs from '../../../../../services/APIs'
import IOSSwitch from '../../catalogos/shared/IOSSwitch'
import CategoriesStorePicker from '../../catalogos/categories/CategoriesStorePicker'
import './PosConfig.css'

interface PosConfigForm {
  template: string | null
  allowManualDiscount: boolean
  askPaymentMethod: boolean
  allowNegativeStock: boolean
}

type FieldKey = 'allowManualDiscount' | 'askPaymentMethod' | 'allowNegativeStock'
type Sources = Partial<Record<FieldKey, 'default' | 'company' | 'branch'>>

const DEFAULTS: PosConfigForm = { template: null, allowManualDiscount: true, askPaymentMethod: true, allowNegativeStock: false }

// Cada giro prellena los interruptores; después se pueden ajustar uno por uno
const TEMPLATES: { key: string; label: string; values: Omit<PosConfigForm, 'template'> }[] = [
  { key: 'STORE', label: 'Tienda / zapatería', values: { allowManualDiscount: true, askPaymentMethod: true, allowNegativeStock: false } },
  { key: 'BAKERY', label: 'Panadería', values: { allowManualDiscount: false, askPaymentMethod: false, allowNegativeStock: false } },
  { key: 'RESTAURANT', label: 'Cocina / restaurante', values: { allowManualDiscount: true, askPaymentMethod: true, allowNegativeStock: true } },
]

const PosConfig = () => {
  const userState = useSelector((state: any) => state.user)
  const [companyId, setCompanyId] = useState<number>(userState?.activeCompanyId ?? userState?.companyId ?? 0)
  const [branchId, setBranchId] = useState<number>(userState?.activeBranchId ?? userState?.branchId ?? 0)
  // 'company' guarda para toda la empresa; 'branch' crea una excepción de la sucursal elegida
  const [scope, setScope] = useState<'company' | 'branch'>('company')

  const [form, setForm] = useState<PosConfigForm>(DEFAULTS)
  const [saved, setSaved] = useState<PosConfigForm>(DEFAULTS)
  const [hasOverride, setHasOverride] = useState(false)
  // De dónde sale cada valor: valor por omisión, empresa o excepción de la sucursal
  const [sources, setSources] = useState<Sources>({})
  // Campos de la sucursal que el usuario devolvió a "heredar de la empresa"
  const [inheritFields, setInheritFields] = useState<FieldKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const targetBranchId = scope === 'branch' ? branchId : 0
  const canEdit = companyId > 0 && (scope === 'company' || branchId > 0)

  useEffect(() => {
    if (!companyId) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        setLoading(true)
        const res: any = await APIs.getPosConfig(companyId, targetBranchId)
        const d = res?.data ?? {}
        const loaded: PosConfigForm = {
          template: d.template ?? null,
          allowManualDiscount: d.allowManualDiscount ?? true,
          askPaymentMethod: d.askPaymentMethod ?? true,
          allowNegativeStock: d.allowNegativeStock ?? false,
        }
        setForm(loaded)
        setSaved(loaded)
        setSources(d.sources ?? {})
        setInheritFields([])
        setHasOverride(!!d.hasBranchOverride)
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'No se pudo cargar la configuración', text: err?.message })
      } finally {
        setLoading(false)
      }
    })()
  }, [companyId, targetBranchId])

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved) || inheritFields.length > 0, [form, saved, inheritFields])

  const applyTemplate = (key: string) => {
    const t = TEMPLATES.find((x) => x.key === key)
    if (t) setForm({ template: key, ...t.values })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    try {
      setIsSaving(true)
      // Solo se envía lo que cambió: en una sucursal, lo demás sigue heredándose de la empresa
      const payload: Record<string, unknown> = {}
      ;(['allowManualDiscount', 'askPaymentMethod', 'allowNegativeStock'] as FieldKey[]).forEach((k) => {
        if (scope === 'branch' && inheritFields.includes(k)) payload[k] = null
        else if (scope === 'company' || form[k] !== saved[k]) payload[k] = form[k]
      })
      if (form.template !== saved.template) payload.template = form.template
      await APIs.updatePosConfig(companyId, targetBranchId, payload)
      setSaved(form)
      setInheritFields([])
      if (scope === 'branch') {
        const res: any = await APIs.getPosConfig(companyId, targetBranchId)
        setSources(res?.data?.sources ?? {})
        setHasOverride(!!res?.data?.hasBranchOverride)
      }
      Swal.fire({ icon: 'success', title: 'Configuración guardada', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error al guardar', text: err?.response?.data?.message || err?.message })
    } finally {
      setIsSaving(false)
    }
  }

  const removeOverride = async () => {
    const r = await Swal.fire({
      title: '¿Volver a la configuración de la empresa?',
      text: 'Esta sucursal dejará de tener ajustes propios.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, volver',
      cancelButtonText: 'Cancelar',
    })
    if (!r.isConfirmed) return
    try {
      await APIs.deletePosConfigOverride(companyId, branchId)
      setScope('company')
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo quitar', text: err?.response?.data?.message || err?.message })
    }
  }

  const originLabel = (k: FieldKey) => {
    if (scope !== 'branch') return null
    const src = inheritFields.includes(k) ? 'company' : sources[k]
    if (src === 'branch') {
      return (
        <button type='button' className='pos-config__origin pos-config__origin--own' onClick={() => setInheritFields((p) => [...p, k])}>
          Propio de la sucursal · usar el de la empresa
        </button>
      )
    }
    return <span className='pos-config__origin'>Heredado de la empresa</span>
  }

  return (
    <div className='pos-config'>
      <form className='pos-config__container' onSubmit={handleSave} noValidate>
        <div className='pos-config__header'>
          <div className='pos-config__lead-group'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={setBranchId}
              onCompanyIdChange={setCompanyId}
            />
            <div className='pos-config__scope' role='tablist' aria-label='Alcance de la configuración'>
              <button type='button' className={`pos-config__scope-tab ${scope === 'company' ? 'pos-config__scope-tab--active' : ''}`} onClick={() => setScope('company')}>
                Toda la empresa
              </button>
              <button type='button' className={`pos-config__scope-tab ${scope === 'branch' ? 'pos-config__scope-tab--active' : ''}`} onClick={() => setScope('branch')}>
                Solo esta sucursal
              </button>
            </div>
          </div>
          <div className='pos-config__header-actions'>
            {scope === 'branch' && hasOverride && (
              <button type='button' className='btn__general-secondary' onClick={removeOverride} disabled={isSaving}>
                Volver a la de la empresa
              </button>
            )}
            {dirty && (
              <button type='button' className='btn__general-secondary' onClick={() => setForm(saved)} disabled={isSaving}>
                Descartar
              </button>
            )}
            <button type='submit' className='btn__general-primary' disabled={isSaving || loading || !canEdit}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        <p className='pos-config__lead'>
          {scope === 'company'
            ? 'Aplica a todas las sucursales que no tengan ajustes propios.'
            : branchId > 0
              ? hasOverride
                ? 'Esta sucursal tiene ajustes propios.'
                : 'Al guardar, esta sucursal dejará de heredar de la empresa.'
              : 'Selecciona una sucursal.'}
        </p>

        <section className='pos-config__panel'>
          <h3 className='pos-config__panel-title'>
            <span className='material-symbols-rounded'>storefront</span>
            Tipo de negocio
          </h3>
          <div className='pos-config__templates'>
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type='button'
                className={`pos-config__template ${form.template === t.key ? 'pos-config__template--active' : ''}`}
                onClick={() => applyTemplate(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className='pos-config__panel'>
          <h3 className='pos-config__panel-title'>
            <span className='material-symbols-rounded'>point_of_sale</span>
            Ficha de cobro
          </h3>
          {loading ? (
            <div className='pos-config__skeleton' />
          ) : (
            <>
              <div className='pos-config__row'>
                <div className='pos-config__row-text'>
                  <strong>Elegir forma de pago al cobrar</strong>
                  <span>Muestra efectivo, tarjeta, transferencia, etc. Apagado, todo se cobra en efectivo.</span>
                  {originLabel('askPaymentMethod')}
                </div>
                <IOSSwitch
                  checked={form.askPaymentMethod}
                  onChange={(checked) => setForm({ ...form, askPaymentMethod: checked })}
                  ariaLabel='Elegir forma de pago al cobrar'
                />
              </div>
              <div className='pos-config__row'>
                <div className='pos-config__row-text'>
                  <strong>Descuento manual</strong>
                  <span>Permite capturar un porcentaje de descuento en la ficha.</span>
                  {originLabel('allowManualDiscount')}
                </div>
                <IOSSwitch
                  checked={form.allowManualDiscount}
                  onChange={(checked) => setForm({ ...form, allowManualDiscount: checked })}
                  ariaLabel='Descuento manual'
                />
              </div>
              <div className='pos-config__row'>
                <div className='pos-config__row-text'>
                  <strong>Vender sin existencias</strong>
                  <span>Permite cobrar aunque el almacén no tenga suficiente; el saldo puede quedar negativo. Apagado, la venta se rechaza.</span>
                  {originLabel('allowNegativeStock')}
                </div>
                <IOSSwitch
                  checked={form.allowNegativeStock}
                  onChange={(checked) => setForm({ ...form, allowNegativeStock: checked })}
                  ariaLabel='Vender sin existencias'
                />
              </div>
            </>
          )}
        </section>

        <p className='pos-config__hint pos-config__hint--standalone'>
          Las formas de pago disponibles se administran en Catálogos &gt; Métodos de pago. Color, talla, rango,
          área de producción, entrega y urgencia salen del propio artículo.
        </p>
      </form>
    </div>
  )
}

export default PosConfig
