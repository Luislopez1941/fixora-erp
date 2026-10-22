import React, { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import { showToast } from '../../../../utils/toast'
import TemplateCard from './template-card/TemplateCard'
import ModalTemplate from './modal-template/ModalTemplate'
import { offerRecalc } from './recalcPrices'
import { TemplateCategory, VariantTemplate, errorText, readCompanyId } from './variantTypes'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../../cash-register/shared/CashShared.css'
import './Variantes.css'

/** Catálogos › Variantes: plantillas de variantes (ejes como Talla y Color) que se asignan a los artículos. */
const Variantes: React.FC = () => {
  const can = useCan()
  const canView = can('catalogos.productos-y-servicios-variantes.view')
  const canManage = can('catalogos.productos-y-servicios-variantes.manage')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [companyId, setCompanyId] = useState<number | null>(() => readCompanyId())
  const [templates, setTemplates] = useState<VariantTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState<{ template?: VariantTemplate } | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!canView) return setLoading(false)
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getVariantTemplates(companyId)
      setTemplates(res?.data?.templates ?? [])
      setCategories(res?.data?.categories ?? [])
    } catch (e) {
      setError(errorText(e, 'No se pudieron cargar las plantillas.'))
    } finally {
      setLoading(false)
    }
  }, [companyId, canView])

  useEffect(() => {
    load()
  }, [load])

  const run = async (t: VariantTemplate, fn: () => Promise<any>, ok: string) => {
    setBusy(t.id)
    try {
      await fn()
      showToast({ type: 'success', title: ok, text: t.name })
      await load()
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo completar', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setBusy(null)
    }
  }

  const remove = async (t: VariantTemplate) => {
    const ok = await Swal.fire({
      title: '¿Eliminar la plantilla?',
      html: `<b>${t.name}</b> se elimina. Ningún artículo la usa.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d64545',
    })
    if (ok.isConfirmed) run(t, () => APIs.deleteVariantTemplate(t.id), 'Plantilla eliminada')
  }

  if (!canView) {
    return (
      <div className='cash-ui'>
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>lock</span>
          <p>No tienes permiso para ver las plantillas de variantes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='cash-ui variantes'>
      <div className='cash-ui__container'>
        <div className='cash-ui__header'>
          <div className='cash-ui__title'>
            <h1>Plantillas de variantes</h1>
            <p>Úsalas cuando un producto se vende en varias versiones: tallas, colores, sabores o medidas.</p>
          </div>
          <CategoriesStorePicker branchId={branchId} onBranchIdChange={setBranchId} onCompanyIdChange={setCompanyId} companyOnly />
        </div>

        {canManage ? (
          <div className='cash-ui__filters variantes__bar'>
            <button type='button' className='btn__general-purple' onClick={() => setEditor({})}>
              <span className='material-symbols-rounded'>add</span> Nueva plantilla
            </button>
          </div>
        ) : null}

        {error ? (
          <div className='cash-ui__error' role='alert'>
            <span className='material-symbols-rounded' aria-hidden>error</span>
            <span>{error}</span>
            <button type='button' onClick={load} aria-label='Reintentar'>
              <span className='material-symbols-rounded'>refresh</span>
            </button>
          </div>
        ) : null}

        {loading && !templates.length ? (
          <div className='variantes__grid'>
            {Array.from({ length: 4 }, (_, i) => <span key={i} className='table-skeleton__shimmer variantes__skeleton' />)}
          </div>
        ) : (
          <div className={`variantes__grid ${loading ? 'is-loading' : ''}`}>
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                busy={busy === t.id}
                canManage={canManage}
                onEdit={() => setEditor({ template: t })}
                onDuplicate={() => run(t, () => APIs.duplicateVariantTemplate(t.id), 'Plantilla duplicada')}
                onToggle={() => run(t, () => APIs.updateVariantTemplate(t.id, { active: !t.active }), t.active ? 'Plantilla desactivada' : 'Plantilla activada')}
                onDelete={() => remove(t)}
                onRecalc={async () => {
                  setBusy(t.id)
                  try {
                    if (await offerRecalc(t.id, t.name)) await load()
                  } finally {
                    setBusy(null)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {editor ? (
        <ModalTemplate
          companyId={companyId}
          template={editor.template}
          categories={categories}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null)
            load()
          }}
        />
      ) : null}
    </div>
  )
}

export default Variantes
