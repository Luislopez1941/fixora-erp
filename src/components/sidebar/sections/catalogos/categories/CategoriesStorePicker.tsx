import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import APIs from '../../../../../services/APIs'
import '../../../../general/skeleton/TableSkeleton.css'
import './CategoriesStorePicker.css'

const LS_COMPANY = 'categories-picker-company-id'
const LS_BRANCH = 'categories-picker-branch-id'

type OpenKey = 'company' | 'branch' | null

export interface CategoriesStorePickerProps {
  branchId: number
  onBranchIdChange: (id: number) => void
  /** Notifica cuando el usuario cambia de empresa (para recargar filtros dependientes). */
  onCompanyIdChange?: (id: number) => void
  /** 'toolbar' = barra de lista; 'modal' = mismo flujo con estilos de formulario */
  variant?: 'toolbar' | 'modal'
  /** Solo modal: cerrar desplegables al abrir audiencia/género */
  closeStoresSignal?: number
  /** Solo modal: al abrir empresa/sucursal, cerrar audiencia/género */
  onDropdownOpen?: () => void
  /** Ocultar selector de empresa si solo hay una */
  hideIfSingleCompany?: boolean
  /** Ocultar selector de sucursal si hay 0 o 1 real (auto-seleccionar) */
  hideIfSingleBranch?: boolean
  /** Solo empresa: para registros que son de la empresa (categorías) y no de una sucursal. */
  companyOnly?: boolean
}

/**
 * Empresa → Sucursal; el ID se usa como branchId en el API de categorías.
 */
const CategoriesStorePicker: React.FC<CategoriesStorePickerProps> = ({
  branchId,
  onBranchIdChange,
  onCompanyIdChange,
  variant = 'toolbar',
  closeStoresSignal,
  onDropdownOpen,
  // Por defecto no se muestran los selectores si solo hay una empresa / una sucursal real
  // (no hay nada que elegir). Quien quiera verlos siempre pasa `false`.
  hideIfSingleCompany = true,
  hideIfSingleBranch = true,
  companyOnly = false,
}) => {
  const userState = useSelector((s: any) => s.user)
  const userId = Number(userState?.id ?? userState?._id)
  const authToken = localStorage.getItem('token-fixora') || undefined
  const branchIdRef = useRef(branchId)
  branchIdRef.current = branchId

  const [companies, setCompanies] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const [open, setOpen] = useState<OpenKey>(null)
  // Mientras cargan empresas/sucursales se muestra un skeleton en lugar de nada
  const [companiesLoaded, setCompaniesLoaded] = useState(false)
  const [branchesLoaded, setBranchesLoaded] = useState(false)

  useEffect(() => {
    if (closeStoresSignal == null) return
    setOpen(null)
  }, [closeStoresSignal])

  const toggle = (key: Exclude<OpenKey, null>) => {
    setOpen((prev) => {
      if (prev === key) return null
      onDropdownOpen?.()
      return key
    })
  }

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const res: any = await APIs.getCompaniesByUser(userId)
        const list = Array.isArray(res?.data) ? res.data : []
        if (cancelled) return
        setCompanies(list)
        const savedCo = Number(localStorage.getItem(LS_COMPANY))
        const co =
          list.some((x: any) => x.id === savedCo) ? savedCo : list[0]?.id ?? null
        const resolvedCo = co != null && !Number.isNaN(co) ? co : null
        setCompanyId(resolvedCo)
        if (resolvedCo != null) {
          onCompanyIdChange?.(resolvedCo)
        }
      } catch {
        if (!cancelled) {
          setCompanies([])
          setCompanyId(null)
        }
      } finally {
        if (!cancelled) setCompaniesLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, authToken])

  useEffect(() => {
    if (!userId || companyId == null) {
      setBranches([])
      setSelectedBranchId(null)
      return
    }
    setBranchesLoaded(false)
    let cancelled = false
    ;(async () => {
      try {
        const res: any = await APIs.getBranch({ userId, companyId }, undefined, authToken)
        const raw = Array.isArray(res?.data) ? res.data : []
        const list = [{ id: 0, name: 'Sin sucursal' }, ...raw]
        if (cancelled) return
        setBranches(list)
        const savedBr = Number(localStorage.getItem(LS_BRANCH))
        let br = list.some((x: any) => x.id === savedBr) ? savedBr : list[0]?.id ?? null
        // Si hideIfSingleBranch y solo hay 1 real branch, auto-seleccionar la real (no "Sin sucursal")
        if (hideIfSingleBranch && list.length === 2) {
          const real = list.find((x: any) => x.id > 0)
          if (real) br = real.id
        }
        setSelectedBranchId(br != null && !Number.isNaN(br) ? br : null)
      } catch {
        if (!cancelled) {
          setBranches([])
          setSelectedBranchId(null)
        }
      } finally {
        if (!cancelled) setBranchesLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, companyId, authToken])

  // Sincroniza la selección solo cuando el padre cambia branchId. Depender también de `branches`
  // provocaba un ciclo infinito (el padre y el picker se pedían cambios opuestos) cuando la sucursal
  // guardada en localStorage difería de la inicial del padre, y con él un bucle de peticiones.
  const notifiedRef = useRef<number | null>(null)
  const branchesRef = useRef(branches)
  branchesRef.current = branches
  useEffect(() => {
    const list = branchesRef.current
    if (list.length === 0) return
    if (!list.some((b: any) => b.id === branchId)) return
    notifiedRef.current = branchId // el cambio vino del padre: no hay que devolvérselo
    setSelectedBranchId((prev) => (prev === branchId ? prev : branchId))
  }, [branchId])

  // Última sucursal avisada al padre: evita avisar dos veces la misma y cortar cualquier ciclo de cambios
  useEffect(() => {
    if (selectedBranchId == null) return
    if (selectedBranchId === notifiedRef.current) return
    notifiedRef.current = selectedBranchId
    if (selectedBranchId !== branchIdRef.current) {
      onBranchIdChange(selectedBranchId)
    }
  }, [selectedBranchId, onBranchIdChange])

  const handleCompany = (c: any) => {
    localStorage.setItem(LS_COMPANY, String(c.id))
    setCompanyId(c.id)
    onCompanyIdChange?.(c.id)
    setOpen(null)
  }

  const handleBranch = (b: any) => {
    localStorage.setItem(LS_BRANCH, String(b.id))
    setSelectedBranchId(b.id)
    setOpen(null)
  }

  const companyName =
    companies.find((c) => c.id === companyId)?.name ?? 'Selecciona empresa'
  const branchName =
    branches.find((b) => b.id === selectedBranchId)?.name ?? 'Selecciona sucursal'

  const renderSelect = (
    key: Exclude<OpenKey, null>,
    label: string,
    display: string,
    items: any[],
    onPick: (item: any) => void,
    nameKey = 'name',
  ) => {
    const isOpen = open === key
    const isModal = variant === 'modal'
    if (isModal) {
      return (
        <div className={`cat-modal-select ${isOpen ? 'cat-modal-select--open' : ''}`}>
          <label className='cat-modal-select__label'>{label}</label>
          <div className='cat-modal-select__control'>
            <button
              type='button'
              className={`cat-modal-select__trigger ${isOpen ? 'is-open' : ''}`}
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              aria-haspopup='listbox'
            >
              <span className='cat-modal-select__value'>{display}</span>
              <svg className='cat-modal-select__chev' xmlns='http://www.w3.org/2000/svg' height='16' width='16' viewBox='0 0 512 512' aria-hidden>
                <path
                  fill='currentColor'
                  d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z'
                />
              </svg>
            </button>
            <div className={`cat-modal-select__menu ${isOpen ? 'is-open' : ''}`} role='listbox'>
              <ul className='cat-modal-select__list'>
                {items.map((item: any) => (
                  <li key={item.id}>
                    <button type='button' className='cat-modal-select__option' onClick={() => onPick(item)}>
                      {item[nameKey] ?? item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className={`cat-toolbar-select cat-toolbar-select--store ${isOpen ? 'cat-toolbar-select--open' : ''}`}>
        <span className='cat-toolbar-select__label'>{label}</span>
        <div className='cat-toolbar-select__control'>
          <button
            type='button'
            className={`cat-toolbar-select__trigger ${isOpen ? 'is-open' : ''}`}
            onClick={() => toggle(key)}
            aria-expanded={isOpen}
            aria-haspopup='listbox'
          >
            <span className='cat-toolbar-select__value'>{display}</span>
            <svg className='cat-toolbar-select__chev' xmlns='http://www.w3.org/2000/svg' height='14' width='14' viewBox='0 0 512 512' aria-hidden>
              <path
                fill='currentColor'
                d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z'
              />
            </svg>
          </button>
          <div className={`cat-toolbar-select__menu ${isOpen ? 'is-open' : ''}`} role='listbox'>
            <ul className='cat-toolbar-select__list'>
              {items.map((item: any) => (
                <li key={item.id}>
                  <button type='button' className='cat-toolbar-select__option' onClick={() => onPick(item)}>
                    {item[nameKey] ?? item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <p className={`text categories__store-picker__warn ${variant === 'modal' ? 'categories-modal__store-warn' : ''}`}>
        Inicia sesión para cargar empresas y sucursales.
      </p>
    )
  }

  // Skeleton (barras con brillo) mientras cargan los datos de los selectores
  if (!companiesLoaded || (companyId != null && !branchesLoaded)) {
    return (
      <div
        className={variant === 'modal' ? 'categories-modal__store-row' : 'categories-toolbar__stores'}
        role='status'
        aria-label='Cargando empresa y sucursal'
      >
        <span className='table-skeleton__shimmer' style={{ width: 180, height: 38, borderRadius: 8 }} />
      </div>
    )
  }

  const showCompany = !hideIfSingleCompany || companies.length > 1
  const showBranch = !companyOnly && (!hideIfSingleBranch || branches.length > 2)

  return (
    <div className={variant === 'modal' ? 'categories-modal__store-row' : 'categories-toolbar__stores'}>
      {showCompany && renderSelect('company', 'Empresa', companyName, companies, handleCompany)}
      {showBranch && renderSelect('branch', 'Sucursal', branchName, branches, handleBranch)}
    </div>
  )
}

export default CategoriesStorePicker
