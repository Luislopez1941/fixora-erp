import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import './Areas.css'
import APIs from '../../../../../services/APIs'
import ModalAreas from './modal-areas/ModalAreas'
import Swal from 'sweetalert2'

interface AreaNode {
  id: number
  name: string
  typeId: number
  areaType?: { id: number; label: string; color: string } | null
  branchName: string
  leader: { id: number; firstName: string; firstLastName: string } | null
  _count?: { members: number; children: number }
  children?: AreaNode[]
  parent?: { id: number; name: string } | null
}

const TreeRow: React.FC<{
  area: AreaNode
  depth: number
  onEdit: (area: AreaNode) => void
  onDelete: (area: AreaNode) => void
  deletingId: number | null
}> = ({ area, depth, onEdit, onDelete, deletingId }) => {
  const indent = depth * 24
  const hasChildren = (area.children?.length ?? 0) > 0
  const isDeleting = deletingId === area.id

  return (
    <>
      <div className='areas__row' style={{ paddingLeft: `${16 + indent}px` }}>
        <div className='areas__td areas__td--name'>
          <span className='areas__tree-line'>
            {hasChildren && (
              <svg className='areas__tree-icon' width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            )}
            {!hasChildren && <span className='areas__tree-spacer' />}
            <span className='areas__name'>{area.name}</span>
          </span>
          {area.parent && <span className='areas__parent'>↑ {area.parent.name}</span>}
        </div>
        <div className='areas__td'>{area.areaType?.label ?? '—'}</div>
        <div className='areas__td'>{area.branchName || '—'}</div>
        <div className='areas__td'>
          {area.leader ? `${area.leader.firstName} ${area.leader.firstLastName}` : '—'}
        </div>
        <div className='areas__td areas__td--count'>
          <span className='areas__badge'>{area._count?.members ?? 0} miembros</span>
        </div>
        <div className='areas__td areas__td--actions'>
          <div className='edit-icon' title='Editar área' aria-label='Editar área' onClick={() => !isDeleting && onEdit(area)}>
            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden>
              <path stroke='none' d='M0 0h24v24H0z' fill='none' />
              <path d='M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1' />
              <path d='M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z' />
              <path d='M16 5l3 3' />
            </svg>
          </div>
          <div className='delete-icon' title='Eliminar área' aria-label='Eliminar área' onClick={() => !isDeleting && onDelete(area)}>
            {isDeleting ? <span className='loader_btn'></span> : (
              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
                <path stroke='none' d='M0 0h24v24H0z' fill='none' />
                <path d='M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z' />
                <path d='M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z' />
              </svg>
            )}
          </div>
        </div>
      </div>
      {area.children?.map((child) => (
        <TreeRow key={child.id} area={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} deletingId={deletingId} />
      ))}
    </>
  )
}

const Areas: React.FC = () => {
  const dispatch = useDispatch()
  const userState = useSelector((s: any) => s.user)
  const userId = Number(userState?.id ?? userState?._id)

  const [areas, setAreas] = useState<AreaNode[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedArea, setSelectedArea] = useState<AreaNode | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchAreas = useCallback(async (cId?: number | null) => {
    // Sin empresa elegida (o sin empresas vinculadas) se piden todas las áreas en vez
    // de dejar la lista vacía con "Selecciona una empresa".
    const id = cId === undefined ? companyId : cId
    setLoading(true)
    try {
      const res: any = await APIs.getAreaTree(id ?? undefined)
      setAreas(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setAreas([])
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res: any = await APIs.getCompanies(userId)
        const list = Array.isArray(res?.data) ? res.data : []
        setCompanies(list)
        if (list.length > 0) {
          setCompanyId(list[0].id)
          fetchAreas(list[0].id)
        } else {
          fetchAreas(null)
        }
      } catch {
        fetchAreas(null)
      }
    }
    loadCompanies()
  }, [userId])

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null
    setCompanyId(id)
    fetchAreas(id)
  }

  const handleCreate = () => {
    setSelectedArea(null)
    dispatch(modal('areas_modal'))
  }

  const handleEdit = (area: AreaNode) => {
    setSelectedArea(area)
    dispatch(modal('areas_modal'))
  }

  const handleDelete = async (area: AreaNode) => {
    const hasChildren = (area.children?.length ?? 0) > 0
    const result = await Swal.fire({
      title: `¿Eliminar "${area.name}"?`,
      text: hasChildren
        ? 'Esta área tiene sub-áreas — al eliminarla, esas sub-áreas pasan a quedar sin área padre (de nivel raíz). Esta acción no se puede deshacer.'
        : 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    })
    if (!result.isConfirmed) return

    setDeletingId(area.id)
    try {
      await APIs.deleteArea(area.id)
      Swal.fire('Listo', 'Área eliminada', 'success')
      await fetchAreas()
    } catch (err: any) {
      Swal.fire('Error', err.response?.data?.message || 'No se pudo eliminar el área', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const flatCount = (nodes: AreaNode[]): number => {
    let count = nodes.length
    for (const n of nodes) {
      if (n.children) count += flatCount(n.children)
    }
    return count
  }

  return (
    <div className='areas'>
      <div className='areas__container'>
        <div className='areas__header-row'>
          <div className='areas__filters'>
            <select
              className='inputs__general areas__company-select'
              value={companyId ?? ''}
              onChange={handleCompanyChange}
            >
              <option value=''>Todas las empresas</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className='areas__count-bar'>
              <span>Total</span>
              <span className='areas__count-num'>{flatCount(areas)}</span>
            </div>
          </div>
          <button className='btn__general-primary' onClick={handleCreate}>
            + Crear área
          </button>
        </div>

        <div className='areas__table'>
          <div className='areas__thead'>
            <div className='areas__th'>Nombre</div>
            <div className='areas__th'>Tipo</div>
            <div className='areas__th'>Sucursal</div>
            <div className='areas__th'>Líder</div>
            <div className='areas__th'>Miembros</div>
            <div className='areas__th areas__th--actions'>Acciones</div>
          </div>

          {loading ? (
            <div className='areas__loading'>Cargando áreas…</div>
          ) : areas.length > 0 ? (
            <div className='areas__tbody'>
              {areas.map((area) => (
                <TreeRow key={area.id} area={area} depth={0} onEdit={handleEdit} onDelete={handleDelete} deletingId={deletingId} />
              ))}
            </div>
          ) : (
            <div className='areas__empty'>No hay áreas configuradas.</div>
          )}
        </div>

        <ModalAreas area={selectedArea} companyId={companyId} onSaved={() => fetchAreas()} />
      </div>
    </div>
  )
}

export default Areas
