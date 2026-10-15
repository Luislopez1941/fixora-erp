import { createPortal } from 'react-dom'
import React, { useEffect, useState } from 'react'
import './ModalAreaType.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import Swal from 'sweetalert2'

interface Props {
  companyId: number | null
  // Con `type` y el modal en modo edición se edita ese tipo
  type?: any | null
  onSaved?: () => void
}

const ModalAreaType: React.FC<Props> = ({ companyId: pageCompanyId, type, onSaved }) => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const userState = useSelector((store: any) => store.user)

  const [companies, setCompanies] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [companyId, setCompanyId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [isProduction, setIsProduction] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'info' | 'company'>('info')
  const isUpdate = modalState === 'area_type_modal_update'
  const isOpen = modalState === 'area_type_modal' || isUpdate

  const handleModalChange = (value: string) => dispatch(modal(value))

  const loadBranches = async (cId: number) => {
    try {
      const res: any = await APIs.getBranch({ companyId: cId, userId: userState.id })
      setBranches(Array.isArray(res?.data) ? res.data : [])
    } catch { setBranches([]) }
  }

  useEffect(() => {
    if (!isOpen) return
    setTab('info')
    if (isUpdate && type) {
      setLabel(type.label ?? '')
      setDescription(type.description ?? '')
      setIsProduction(Boolean(type.isProduction))
      setBranchId(type.branchId ? String(type.branchId) : '')
      setCompanyId(String(type.companyId))
      loadBranches(type.companyId)
      APIs.getCompanies(userState.id).then((res: any) => setCompanies(Array.isArray(res?.data) ? res.data : [])).catch(() => setCompanies([]))
      return
    }
    setLabel('')
    setDescription('')
    setIsProduction(false)
    setBranchId('')

    const loadCompanies = async () => {
      try {
        const res: any = await APIs.getCompanies(userState.id)
        const co = Array.isArray(res?.data) ? res.data : []
        setCompanies(co)
        const preselected = pageCompanyId && co.some((c: any) => c.id === pageCompanyId) ? pageCompanyId : co[0]?.id
        if (preselected) {
          setCompanyId(String(preselected))
          await loadBranches(preselected)
        }
      } catch { setCompanies([]) }
    }
    loadCompanies()
  }, [modalState, type])

  const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    setCompanyId(String(id))
    setBranchId('')
    await loadBranches(id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      Swal.fire('Falta información', 'El nombre del tipo es obligatorio.', 'warning')
      return
    }
    if (!companyId) {
      Swal.fire('Falta información', 'Selecciona una empresa.', 'warning')
      return
    }

    setSaving(true)
    try {
      if (isUpdate && type?.id) {
        // En edición "vacío" significa "todas las sucursales" (null) y hay que mandarlo explícito
        await APIs.updateAreaType(type.id, {
          branchId: branchId ? Number(branchId) : null,
          label: label.trim(),
          description: description.trim() || null,
          isProduction,
        })
      } else {
        await APIs.createAreaType({
          companyId: Number(companyId),
          branchId: branchId ? Number(branchId) : undefined,
          label: label.trim(),
          description: description.trim() || undefined,
          isProduction,
        })
      }
      Swal.fire('Listo', isUpdate ? 'Tipo de área actualizado' : 'Tipo de área creado', 'success')
      handleModalChange('')
      onSaved?.()
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className={`area-type_modal__overlay ${isOpen ? 'active' : ''}`}>
      <div className={`area-type_modal__popup ${isOpen ? 'active' : ''}`}>
        <div className='area-type_modal__header'>
          <button type='button' className='area-type_modal__close' onClick={() => handleModalChange('')} aria-label='Cerrar'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line></svg>
          </button>
          <p className='area-type_modal__title'>{isUpdate ? 'Editar tipo de área' : 'Nuevo tipo de área'}</p>
        </div>

        <div className='area-type_modal__tabs' role='tablist'>
          <button type='button' role='tab' aria-selected={tab === 'info'} className={`area-type_modal__tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
            Información
          </button>
          <button type='button' role='tab' aria-selected={tab === 'company'} className={`area-type_modal__tab ${tab === 'company' ? 'active' : ''}`} onClick={() => setTab('company')}>
            Empresa y sucursal
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='area-type_modal__body'>
            <div hidden={tab !== 'info'} className='area-type_modal__pane'>
            <div>
              <label className='label__general'>Nombre</label>
              <input className='inputs__general' value={label} onChange={(e) => setLabel(e.target.value)} placeholder='ej. Recursos Humanos' required />
            </div>
            <div>
              <label className='label__general'>Descripción (opcional)</label>
              <input className='inputs__general' value={description} onChange={(e) => setDescription(e.target.value)} placeholder='ej. Reclutamiento y nómina' />
            </div>
            <label className={`area-type_modal__check ${isProduction ? 'is-checked' : ''}`}>
              <input
                className='area-type_modal__check-input'
                type='checkbox'
                checked={isProduction}
                onChange={(e) => setIsProduction(e.target.checked)}
              />
              <span className='area-type_modal__check-box' aria-hidden>
                <span className='material-symbols-rounded'>check</span>
              </span>
              <span className='area-type_modal__check-text'>
                <strong>Es un tipo de producción</strong>
                <small>Las áreas de este tipo se consideran áreas de producción.</small>
              </span>
            </label>

            </div>
            <div hidden={tab !== 'company'} className='area-type_modal__pane'>
            <div className='area-type_modal__company'>
              <div>
                <label className='label__general'>Empresa</label>
                {companies.length > 1 && !isUpdate ? (
                  <select className='inputs__general' value={companyId} onChange={handleCompanyChange}>
                    <option value=''>Selecciona</option>
                    {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <p className='area-type_modal__static'>{companies.find((c: any) => String(c.id) === companyId)?.name ?? '—'}</p>
                )}
              </div>
              <div>
                <label className='label__general'>Sucursal</label>
                {branches.length > 1 ? (
                  <select className='inputs__general' value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                    <option value=''>Todas las sucursales</option>
                    {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                ) : (
                  <p className='area-type_modal__static'>{branches[0]?.name ?? 'Todas las sucursales'}</p>
                )}
                <small className='area-type_modal__hint'>Un tipo limitado a una sucursal solo se puede usar en áreas de esa sucursal.</small>
              </div>
            </div>
            </div>
            <div className='area-type_modal__actions'>
              <button type='button' className='btn__general-secondary' onClick={() => handleModalChange('')} disabled={saving}>Cancelar</button>
              <button type='submit' className='btn__general-primary' disabled={saving}>
                {saving ? (
                  <>
                    {isUpdate ? 'Guardando…' : 'Creando…'}
                    <span className='loader_btn'></span>
                  </>
                ) : isUpdate ? 'Guardar cambios' : 'Crear tipo'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default ModalAreaType
