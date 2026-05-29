import React, { useEffect, useState } from 'react'
import './ModalAreas.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import Swal from 'sweetalert2'
import { AREA_TYPE_OPTIONS } from '../../../../../../constants/catalogTypes'

interface Props {
  area?: any | null
  onSaved?: () => void
}

const ModalAreas: React.FC<Props> = ({ area, onSaved }) => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const userState = useSelector((store: any) => store.user)
  const isEdit = Boolean(area?.id)

  const [fields, setFields] = useState<any>({
    companyId: '', branchId: '', name: '', type: 'GENERAL',
    parentId: '', leaderId: '', memberToAdd: ''
  })
  const [companies, setCompanies] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [areasList, setAreasList] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleModalChange = (value: string) => dispatch(modal(value))

  const loadData = async () => {
    try {
      const res: any = await APIs.getCompanies(userState.id)
      const co = Array.isArray(res?.data) ? res.data : []
      setCompanies(co)
      if (!isEdit && co.length > 0) {
        setFields((p: any) => ({ ...p, companyId: String(co[0].id) }))
        await loadBranches(co[0].id)
      }
    } catch {}
  }

  const loadBranches = async (companyId: number) => {
    try {
      const res: any = await APIs.getBranch({ companyId, userId: userState.id })
      setBranches(Array.isArray(res?.data) ? res.data : [])
    } catch { setBranches([]) }
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
    loadData()
  }, [modalState])

  useEffect(() => {
    if (!area || modalState !== 'areas_modal') return
    setFields({
      companyId: String(area.companyId ?? ''),
      branchId: String(area.branchId ?? ''),
      name: area.name ?? '',
      type: area.type ?? 'GENERAL',
      parentId: area.parentId ? String(area.parentId) : '',
      leaderId: area.leaderId ? String(area.leaderId) : '',
      memberToAdd: ''
    })
    loadBranches(area.companyId)
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
    setFields((p: any) => ({ ...p, companyId: String(id), branchId: '', parentId: '' }))
    await loadBranches(id)
    await loadAreas(id)
    await loadUsers(id)
  }

  const handleAddMember = async () => {
    if (!area?.id || !fields.memberToAdd) return
    try {
      await APIs.addAreaMember(area.id, { userId: Number(fields.memberToAdd) })
      loadMembers(area.id)
      setFields((p: any) => ({ ...p, memberToAdd: '' }))
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo agregar', 'error')
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!area?.id) return
    try {
      await APIs.removeAreaMember(area.id, userId)
      loadMembers(area.id)
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo quitar', 'error')
    }
  }

  const handleSubmit = async () => {
    const payload = {
      companyId: Number(fields.companyId),
      branchId: Number(fields.branchId),
      name: fields.name.trim(),
      type: fields.type,
      production: fields.type === 'PRODUCTION',
      parentId: fields.parentId ? Number(fields.parentId) : undefined,
      leaderId: fields.leaderId ? Number(fields.leaderId) : undefined,
    }
    try {
      if (isEdit) {
        await APIs.updateArea(area.id, payload)
        Swal.fire('Listo', 'Área actualizada', 'success')
      } else {
        await APIs.createAreas(payload)
        Swal.fire('Listo', 'Área creada', 'success')
      }
      handleModalChange('')
      onSaved?.()
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'Error al guardar', 'error')
    }
  }

  return (
    <div className={`overlay__areas_modal ${modalState === 'areas_modal' ? 'active' : ''}`}>
      <div className={`popup__areas_modal ${modalState === 'areas_modal' ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href="#" className="btn-cerrar-popup__areas_modal" onClick={(e) => { e.preventDefault(); handleModalChange('') }}>×</a>
          <p className='title__modals'>{isEdit ? 'Editar área' : 'Crear nueva área'}</p>
        </div>
        <div className='areas_modal'>
          <div className='areas_modal_container'>
            <div className='row__one'>
              <div>
                <label className='label__general'>Empresa</label>
                <select className='inputs__general' name='companyId' value={fields.companyId} onChange={handleCompanyChange}>
                  <option value=''>Selecciona</option>
                  {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className='label__general'>Sucursal</label>
                <select className='inputs__general' name='branchId' value={fields.branchId} onChange={handleChange}>
                  <option value=''>Selecciona</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className='label__general'>Nombre</label>
                <input className='inputs__general' name='name' value={fields.name} onChange={handleChange} />
              </div>
              <div>
                <label className='label__general'>Tipo</label>
                <select className='inputs__general' name='type' value={fields.type} onChange={handleChange}>
                  {AREA_TYPE_OPTIONS.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className='row__one'>
              <div>
                <label className='label__general'>Área padre</label>
                <select className='inputs__general' name='parentId' value={fields.parentId} onChange={handleChange}>
                  <option value=''>Sin padre (raíz)</option>
                  {areasList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className='label__general'>Líder del área</label>
                <select className='inputs__general' name='leaderId' value={fields.leaderId} onChange={handleChange}>
                  <option value=''>Sin líder</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.firstLastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {isEdit && (
              <div className='areas-modal__members'>
                <label className='label__general'>Miembros del área</label>
                <div className='areas-modal__member-add'>
                  <select className='inputs__general'
                    value={fields.memberToAdd || ''}
                    onChange={(e) => setFields((p: any) => ({ ...p, memberToAdd: e.target.value }))}>
                    <option value=''>Agregar miembro...</option>
                    {users.filter((u: any) => !members.some((m: any) => m.userId === u.id)).map((u: any) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.firstLastName}</option>
                    ))}
                  </select>
                  <button type='button' className='btn__general-primary' onClick={handleAddMember}>+</button>
                </div>
                {loading ? <p className='areas-modal__hint'>Cargando...</p> : members.length > 0 ? (
                  <div className='areas-modal__member-list'>
                    {members.map((m: any) => (
                      <div className='areas-modal__member-item' key={m.id}>
                        <span>{m.user?.firstName} {m.user?.firstLastName}</span>
                        <button type='button' className='btn__general-danger' onClick={() => handleRemoveMember(m.userId)}>Quitar</button>
                      </div>
                    ))}
                  </div>
                ) : <p className='areas-modal__hint'>No hay miembros.</p>}
              </div>
            )}

            <div className='row__three'>
              <button type='button' className='btn__general-secondary' onClick={() => handleModalChange('')}>Cancelar</button>
              <button type='button' className='btn__general-primary' onClick={handleSubmit}>
                {isEdit ? 'Guardar cambios' : 'Crear área'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalAreas
