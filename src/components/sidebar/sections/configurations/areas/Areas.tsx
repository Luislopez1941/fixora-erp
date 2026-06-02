import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../redux/state/modals'
import { getAreaTypeLabel } from '../../../../../constants/catalogTypes'
import './Areas.css'
import APIs from '../../../../../services/APIs'
import ModalAreas from './modal-areas/ModalAreas'

interface AreaNode {
  id: number
  name: string
  type: string
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
}> = ({ area, depth, onEdit }) => {
  const indent = depth * 24
  const hasChildren = (area.children?.length ?? 0) > 0

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
        <div className='areas__td'>{getAreaTypeLabel(area.type)}</div>
        <div className='areas__td'>{area.branchName || '—'}</div>
        <div className='areas__td'>
          {area.leader ? `${area.leader.firstName} ${area.leader.firstLastName}` : '—'}
        </div>
        <div className='areas__td areas__td--count'>
          <span className='areas__badge'>{area._count?.members ?? 0} miembros</span>
        </div>
        <div className='areas__td areas__td--actions'>
          <button className='btn__general-primary' onClick={() => onEdit(area)}>Editar</button>
        </div>
      </div>
      {area.children?.map((child) => (
        <TreeRow key={child.id} area={child} depth={depth + 1} onEdit={onEdit} />
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

  const fetchAreas = useCallback(async (cId?: number | null) => {
    const id = cId ?? companyId
    if (!id) return
    setLoading(true)
    try {
      const res: any = await APIs.getAreaTree(id)
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
        }
      } catch {}
    }
    loadCompanies()
  }, [userId])

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
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
              <option value=''>Selecciona empresa</option>
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
            <div className='areas__th'>Acciones</div>
          </div>

          {!companyId ? (
            <div className='areas__empty'>Selecciona una empresa para ver sus áreas.</div>
          ) : loading ? (
            <div className='areas__loading'>Cargando áreas…</div>
          ) : areas.length > 0 ? (
            <div className='areas__tbody'>
              {areas.map((area) => (
                <TreeRow key={area.id} area={area} depth={0} onEdit={handleEdit} />
              ))}
            </div>
          ) : (
            <div className='areas__empty'>No hay áreas configuradas para esta empresa.</div>
          )}
        </div>

        <ModalAreas area={selectedArea} onSaved={() => fetchAreas()} />
      </div>
    </div>
  )
}

export default Areas
