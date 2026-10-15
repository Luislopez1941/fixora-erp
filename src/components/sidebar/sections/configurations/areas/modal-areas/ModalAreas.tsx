import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './ModalAreas.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import Swal from 'sweetalert2'
import BranchAvailabilityPicker from '../../../catalogos/shared/BranchAvailabilityPicker'

interface Props {
  area?: any | null
  // Empresa que tiene seleccionada la página de Áreas ahora mismo — sin esto,
  // al crear (no editar) el modal siempre arrancaba con la PRIMERA empresa del
  // usuario sin importar cuál estuviera viendo en la página, así que el área
  // nueva se creaba en otra empresa y nunca aparecía en la lista que se refresca.
  companyId?: number | null
  onSaved?: () => void
}

const ModalAreas: React.FC<Props> = ({ area, companyId: selectedCompanyId, onSaved }) => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const userState = useSelector((store: any) => store.user)
  const isEdit = Boolean(area?.id)

  const [fields, setFields] = useState<any>({
    companyId: '', branchId: '', name: '', typeId: '',
    parentId: '', leaderId: '', memberToAdd: ''
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [areasList, setAreasList] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)
  // Sucursales donde opera el área (null = todas). La primera es la principal.
  const [areaBranchIds, setAreaBranchIds] = useState<number[] | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'company' | 'members'>('info')

  const handleModalChange = (value: string) => dispatch(modal(value))

  const loadData = async () => {
    try {
      const res: any = await APIs.getCompanies(userState.id)
      const co = Array.isArray(res?.data) ? res.data : []
      setCompanies(co)
      if (!isEdit && co.length > 0) {
        // Usa la empresa que ya estaba seleccionada en la página, si sigue
        // siendo válida — si no, recién ahí cae a la primera de la lista.
        const preselected = selectedCompanyId && co.some((c: any) => c.id === selectedCompanyId)
          ? selectedCompanyId
          : co[0].id
        setFields((p: any) => ({ ...p, companyId: String(preselected) }))
        await loadBranches(preselected)
        await loadTypes(preselected)
        await loadAreas(preselected)
        await loadUsers(preselected)
      }
    } catch {}
  }

  const loadBranches = async (companyId: number) => {
    try {
      const res: any = await APIs.getBranch({ companyId, userId: userState.id })
      const list = Array.isArray(res?.data) ? res.data : []
      setBranches(list)
      // Con una sola sucursal se usa esa por defecto (el select se oculta).
      if (!isEdit && list.length === 1) {
        setFields((p: any) => ({ ...p, branchId: String(list[0].id) }))
      }
    } catch { setBranches([]) }
  }

  const loadTypes = async (companyId: number) => {
    try {
      const res: any = await APIs.getAreaTypes(companyId)
      const list = Array.isArray(res?.data) ? res.data : []
      setTypes(list)
      // Al crear (no editar), preselecciona "General" o el primero que haya —
      // sin esto el select arrancaba vacío y el área se creaba sin tipo.
      if (!isEdit && list.length > 0) {
        const general = list.find((t: any) => t.label === 'General')
        setFields((p: any) => ({ ...p, typeId: String(general?.id ?? list[0].id) }))
      }
    } catch { setTypes([]) }
  }

  const loadAreas = async (companyId: number) => {
    try {
      const res: any = await APIs.getAreas({ companyId })
      setAreasList((Array.isArray(res?.data) ? res.data : []).filter((a: any) => a.id !== area?.id))
    } catch { setAreasList([]) }
  }

  const loadUsers = async (companyId: number) => {
    try {
      const res: any = await APIs.getSystemUsers({ companyId })
      setUsers(Array.isArray(res?.data) ? res.data : [])
    } catch { setUsers([]) }
  }

  const loadMembers = async (areaId: number) => {
    setLoading(true)
    try {
      const res: any = await APIs.getAreaMembers(areaId)
      setMembers(Array.isArray(res?.data) ? res.data : [])
    } catch { setMembers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (modalState !== 'areas_modal') return
    setActiveTab('info')
    if (!isEdit) setAreaBranchIds(null)
    loadData()
  }, [modalState])

  useEffect(() => {
    if (!area || modalState !== 'areas_modal') return
    setFields({
      companyId: String(area.companyId ?? ''),
      branchId: String(area.branchId ?? ''),
      name: area.name ?? '',
      typeId: area.typeId ? String(area.typeId) : '',
      parentId: area.parentId ? String(area.parentId) : '',
      leaderId: area.leaderId ? String(area.leaderId) : '',
      memberToAdd: ''
    })
    setAreaBranchIds(Array.isArray(area.branchIds) && area.branchIds.length > 0 ? area.branchIds : [area.branchId])
    loadBranches(area.companyId)
    loadTypes(area.companyId)
    loadAreas(area.companyId)
    loadUsers(area.companyId)
    loadMembers(area.id)
  }, [area, modalState])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFields((p: any) => ({ ...p, [name]: value }))
  }

  const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    setFields((p: any) => ({ ...p, companyId: String(id), branchId: '', typeId: '', parentId: '' }))
    await loadBranches(id)
    await loadTypes(id)
    await loadAreas(id)
    await loadUsers(id)
  }

  const handleAddMember = async () => {
    if (!area?.id || !fields.memberToAdd) return
    setAddingMember(true)
    try {
      await APIs.addAreaMember(area.id, { userId: Number(fields.memberToAdd) })
      await loadMembers(area.id)
      setFields((p: any) => ({ ...p, memberToAdd: '' }))
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo agregar', 'error')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!area?.id) return
    const result = await Swal.fire({
      title: `¿Quitar a ${memberName} de la subárea?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return

    setRemovingMemberId(userId)
    try {
      await APIs.removeAreaMember(area.id, userId)
      await loadMembers(area.id)
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo quitar', 'error')
    } finally {
      setRemovingMemberId(null)
    }
  }

  const handleSubmit = async () => {
    // Validaciones básicas antes de mandar nada.
    if (!fields.name.trim()) {
      Swal.fire('Falta información', 'El nombre de la subárea es obligatorio.', 'warning')
      return
    }
    if (!fields.companyId) {
      Swal.fire('Falta información', 'Selecciona una empresa.', 'warning')
      return
    }
    // Sucursales elegidas: la principal es la actual si sigue marcada; si no, la primera marcada
    const allIds = branches.map((b: any) => b.id)
    const chosen: number[] = branches.length > 1 ? (areaBranchIds ?? allIds) : (fields.branchId ? [Number(fields.branchId)] : [])
    if (chosen.length === 0) {
      Swal.fire('Falta información', 'Selecciona al menos una sucursal.', 'warning')
      return
    }
    const currentHome = Number(fields.branchId)
    const homeBranchId = chosen.includes(currentHome) ? currentHome : chosen[0]

    // Al editar, "vacío" significa "quítaselo" (null) — hay que mandarlo
    // explícito. Si mandamos undefined, el backend lo interpreta como "no
    // tocar este campo" (así puede hacer PATCH parciales), así que quitar el
    // área padre o el líder nunca se guardaba, aunque el modal decía éxito.
    // Al crear, en cambio, "vacío" sí es simplemente "no venía" (undefined).
    const payload = {
      companyId: Number(fields.companyId),
      branchId: homeBranchId,
      branchIds: chosen.filter((b) => b !== homeBranchId),
      name: fields.name.trim(),
      typeId: fields.typeId ? Number(fields.typeId) : undefined,
      parentId: fields.parentId ? Number(fields.parentId) : (isEdit ? null : undefined),
      leaderId: fields.leaderId ? Number(fields.leaderId) : (isEdit ? null : undefined),
    }

    setSaving(true)
    try {
      if (isEdit) {
        await APIs.updateArea(area.id, payload)
      } else {
        await APIs.createAreas(payload)
      }
    } catch (err: any) {
      setSaving(false)
      Swal.fire('Error', err.response?.data?.message || 'Error al guardar', 'error')
      return
    }

    // Si dejaste seleccionado un miembro en el combo sin darle clic al "+", se
    // agrega de todos modos al guardar — antes se perdía en silencio porque
    // "Guardar cambios" y "Agregar miembro" eran dos acciones completamente
    // separadas.
    let memberWarning = ''
    if (isEdit && fields.memberToAdd) {
      try {
        await APIs.addAreaMember(area.id, { userId: Number(fields.memberToAdd) })
      } catch (err: any) {
        memberWarning = err.response?.data?.message || 'No se pudo agregar el miembro seleccionado.'
      }
    }

    setSaving(false)
    if (memberWarning) {
      Swal.fire('Área guardada, con un aviso', memberWarning, 'warning')
    } else {
      Swal.fire('Listo', isEdit ? 'Subárea actualizada' : 'Subárea creada', 'success')
    }
    handleModalChange('')
    onSaved?.()
  }

  // Portal al <body>: encima del sidebar y el header.
  return createPortal(
    <div className={`areas_modal__overlay ${modalState === 'areas_modal' ? 'active' : ''}`}>
      <div className={`areas_modal__popup ${modalState === 'areas_modal' ? 'active' : ''}`}>
        <div className='areas_modal__header'>
          <a href="#" className="areas_modal__close" onClick={(e) => { e.preventDefault(); handleModalChange('') }}>×</a>
          <p className='areas_modal__title'>{isEdit ? 'Editar subárea' : 'Crear nueva subárea'}</p>
        </div>
        <div className='areas_modal__tabs' role='tablist'>
          <button type='button' role='tab' aria-selected={activeTab === 'info'} className={`areas_modal__tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            Información
          </button>
          <button type='button' role='tab' aria-selected={activeTab === 'company'} className={`areas_modal__tab ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>
            Empresa y sucursal
          </button>
          {isEdit && (
            <button type='button' role='tab' aria-selected={activeTab === 'members'} className={`areas_modal__tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
              Miembros{members.length > 0 ? ` (${members.length})` : ''}
            </button>
          )}
        </div>

        <div>
          <div className='areas_modal__body'>
            {activeTab === 'info' && (
              <>
                <div className='areas_modal__fields'>
                  <div>
                    <label className='label__general'>Nombre</label>
                    <input className='inputs__general' name='name' value={fields.name} onChange={handleChange} />
                  </div>
                  <div>
                    <label className='label__general'>Área</label>
                    <select className='inputs__general' name='typeId' value={fields.typeId} onChange={handleChange}>
                      <option value=''>Selecciona</option>
                      {types.map((t: any) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <small className='areas_modal__hint'>
                      El área a la que pertenece esta subárea (Ventas, Compras, Almacén, Producción…). Las áreas "de producción"
                      permiten que sus subáreas reciban órdenes de producción. Se administran en Catálogos &gt; Áreas.
                    </small>
                  </div>
                </div>

                <div className='row__one'>
                  <div>
                    <label className='label__general'>Subárea padre</label>
                    <select className='inputs__general' name='parentId' value={fields.parentId} onChange={handleChange}>
                      <option value=''>Sin padre (raíz)</option>
                      {areasList.map((a: any) => <option key={a.id} value={a.id}>{a.name}{a.branchName ? ` · ${a.branchName}` : ''}</option>)}
                    </select>
                    <small className='areas_modal__hint'>
                      {areasList.length === 0
                        ? 'Todavía no hay otras subáreas en esta empresa. Cuando existan, aquí podrás colgar esta de otra.'
                        : 'Opcional: elige la subárea de la que depende esta para armar la jerarquía.'}
                    </small>
                  </div>
                  <div>
                    <label className='label__general'>Líder de la subárea</label>
                    <select className='inputs__general' name='leaderId' value={fields.leaderId} onChange={handleChange}>
                      <option value=''>Sin líder</option>
                      {users.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.firstLastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'company' && (
              <div className='areas_modal__company'>
                <div>
                  <label className='label__general'>Empresa</label>
                  {companies.length > 1 ? (
                    <select className='inputs__general' name='companyId' value={fields.companyId} onChange={handleCompanyChange}>
                      <option value=''>Selecciona</option>
                      {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <p className='areas_modal__static'>{companies[0]?.name ?? '—'}</p>
                  )}
                </div>
                <div>
                  <BranchAvailabilityPicker
                    companyId={Number(fields.companyId) || null}
                    value={areaBranchIds}
                    onChange={setAreaBranchIds}
                    title='Sucursales donde opera'
                    hint={branches.length > 1 ? 'Marca todas las sucursales donde la subárea trabaja; la primera es la principal.' : undefined}
                  />
                </div>
                
              </div>
            )}

            {isEdit && activeTab === 'members' && (
              <div className='areas_modal__members'>
                <div className='areas_modal__member-add'>
                  <select className='inputs__general'
                    value={fields.memberToAdd || ''}
                    onChange={(e) => setFields((p: any) => ({ ...p, memberToAdd: e.target.value }))}>
                    <option value=''>Agregar miembro...</option>
                    {users.filter((u: any) => !members.some((m: any) => m.userId === u.id)).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.firstLastName}</option>
                    ))}
                  </select>
                  <button
                    type='button'
                    className='btn__general-primary'
                    onClick={handleAddMember}
                    disabled={addingMember || !fields.memberToAdd}
                  >
                    {addingMember ? <span className='loader_btn'></span> : '+'}
                  </button>
                </div>
                {loading ? <p className='areas_modal__hint'>Cargando...</p> : members.length > 0 ? (
                  <div className='areas_modal__member-list'>
                    {members.map((m: any) => {
                      const memberName = `${m.user?.firstName ?? ''} ${m.user?.firstLastName ?? ''}`.trim()
                      const isRemoving = removingMemberId === m.userId
                      return (
                        <div className='areas_modal__member-item' key={m.id}>
                          <span>{memberName}</span>
                          <button
                            type='button'
                            className='btn__general-danger'
                            onClick={() => handleRemoveMember(m.userId, memberName)}
                            disabled={isRemoving}
                          >
                            {isRemoving ? <span className='loader_btn'></span> : 'Quitar'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className='areas_modal__hint'>No hay miembros.</p>}
              </div>
            )}

            <div className='areas_modal__actions'>
              <button type='button' className='btn__general-secondary' onClick={() => handleModalChange('')} disabled={saving}>
                Cancelar
              </button>
              <button type='button' className='btn__general-primary' onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    {isEdit ? 'Guardando…' : 'Creando…'}
                    <span className='loader_btn'></span>
                  </>
                ) : (
                  isEdit ? 'Guardar cambios' : 'Crear subárea'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ModalAreas
