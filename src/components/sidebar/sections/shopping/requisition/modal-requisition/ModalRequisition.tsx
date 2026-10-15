import React, { useEffect, useState } from 'react'
import './ModalRequisition.css'
import { useDispatch, useSelector } from 'react-redux'
import { modal } from '../../../../../../redux/state/modals'
import APIs from '../../../../../../services/APIs'
import Swal from 'sweetalert2'

type ReqItem = {
  key: string
  productId: number
  code: string
  name: string
  quantity: number
  unitId: number
  storeId: number
  units: any[]
  stores: any[]
  comments: string
}

const ModalRequisition: React.FC = () => {
  const dispatch = useDispatch()
  const modalState = useSelector((state: any) => state.modals)
  const userState = useSelector((state: any) => state.user)
  const isOpen = modalState === 'requisition_modal'

  const [searchResults, setSearchResults] = useState<any[]>([])
  const [items, setItems] = useState<ReqItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number>(0)

  // Cascading Filters States
  const [companies, setCompanies] = useState<any[]>([])
  const [branchOffices, setBranchOffices] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<number>(0)
  const [selectedBranch, setSelectedBranch] = useState<number>(0)
  const [selectedArea, setSelectedArea] = useState<number>(0)
  const [selectedUrgency, setSelectedUrgency] = useState<string>('NORMAL')

  const [fields, setFields] = useState({
    title: '',
    comments: '',
  })

  const [articuloTemporal, setArticuloTemporal] = useState('')

  const [searchState, setSearchState] = useState({
    type: 1 as 1 | 2, // 1: Code, 2: Name
    field: '',
  })

  const handleModalChange = (value: string) => {
    dispatch(modal(value))
  }

  useEffect(() => {
    if (isOpen && userState?.id) {
      loadInitialData()
    }
  }, [isOpen, userState?.id])

  const loadInitialData = async () => {
    try {
      const userId = userState?.id || 1
      console.log('Loading companies for userId:', userId);
      const compData = await APIs.getCompaniesByUser(userId)
      console.log('Companies data received:', compData);

      // Handle cases where the API might return { data: [...] } instead of [...]
      const companiesList = Array.isArray(compData) ? compData : (compData?.data || []);
      setCompanies(companiesList);
      // Con una sola empresa (o la activa de la sesión si no hay lista) se elige sola.
      const onlyCompanyId = companiesList.length === 1
        ? companiesList[0].id
        : companiesList.length === 0 ? (userState?.activeCompanyId ?? userState?.companyId ?? 0) : 0
      if (onlyCompanyId) await handleCompanyChange(onlyCompanyId)
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const handleCompanyChange = async (companyId: number) => {
    setSelectedCompany(companyId)
    setSelectedBranch(0)
    setSelectedArea(0)
    try {
      const userId = userState?.id || 1
      const response = await APIs.getBranchOffices(companyId, userId)
      const branches = Array.isArray(response) ? response : (response?.data || [])
      setBranchOffices(branches)
      // Con una sola sucursal se elige sola (y carga sus áreas).
      if (branches.length === 1) await handleBranchChange(branches[0].id)
    } catch (error) {
      console.error('Error loading branches:', error)
    }
  }

  const handleBranchChange = async (branchId: number) => {
    setSelectedBranch(branchId)
    setSelectedArea(0)
    try {
      const response = await APIs.getAreas({ branchId })
      const areasData = Array.isArray(response) ? response : (response?.data || [])
      setAreas(areasData)
    } catch (error) {
      console.error('Error loading areas:', error)
    }
  }

  const searchProducts = async (code: string, name: string) => {
    try {
      const response: any = await APIs.getProducts(code, name, undefined)
      setSearchResults(response?.data ?? [])
    } catch (error) {
      console.error('Error searching products:', error)
      setSearchResults([])
    }
  }

  const handleSearchChange = async (val: string) => {
    const isCodeSearch = searchState.type === 1;
    const code = isCodeSearch ? val : '';
    const name = !isCodeSearch ? val : '';
    await searchProducts(code, name);
  };

  const addItem = (product: any) => {
    const newItem: ReqItem = {
      key: `${product.id}-${Date.now()}`,
      productId: product.id,
      code: product.code ?? '',
      name: product.name ?? '',
      quantity: 1,
      unitId: product.productUnits?.[0]?.unit?.id ?? 0,
      storeId: product.stores?.[0]?.id ?? product.productStores?.[0]?.storeId ?? 0,
      units: product.productUnits ?? [],
      stores: product.stores ?? product.productStores ?? [],
      comments: '',
    }
    setItems(prev => [...prev, newItem])
    setSearchResults([])
    setSearchState(prev => ({ ...prev, field: '' }))
  }

  const agregarTmp = () => {
    if (!articuloTemporal.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atención', text: 'Ingresa la descripción del artículo temporal.' })
      return
    }
    const newItem: ReqItem = {
      key: `tmp-${Date.now()}`,
      productId: 0,
      code: 'TMP',
      name: articuloTemporal,
      quantity: 1,
      unitId: 0,
      storeId: 0,
      units: [],
      stores: [],
      comments: '',
    }
    setItems(prev => [...prev, newItem])
    setArticuloTemporal('')
  }

  const updateItem = (key: string, updates: Partial<ReqItem>) => {
    setItems(prev => prev.map(item => item.key === key ? { ...item, ...updates } : item))
  }

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(item => item.key !== key))
  }

  const handleSave = async () => {
    if (items.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Sin artículos', text: 'Agrega al menos un artículo.' })
      return
    }
    if (selectedCompany === 0 || selectedBranch === 0) {
      Swal.fire({ icon: 'warning', title: 'Atención', text: 'Por favor selecciona la Empresa y Sucursal.' })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: fields.title,
        companyId: selectedCompany,
        branchId: selectedBranch,
        areaId: selectedArea,
        urgency: selectedUrgency,
        comments: fields.comments,
        userId: userState?.id || 1,
        option: selectedOption,
        concepts: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitId: item.unitId,
          storeId: item.storeId,
          code: item.code,
          name: item.name,
          comments: item.comments,
        })),
      }
      const response: any = await APIs.createRequisition(payload)
      Swal.fire({ icon: 'success', title: 'Requisición creada', text: response.message })
      handleModalChange('')
      setItems([])
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Error inesperado' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`modal-req-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-req-popup">
        <div className='modal-req-header'>
          <div className='modal-req-header-left'>
            <div className='modal-req-type-selector'>
              <div className='modal-req-type-group'>
                <label className="modal-req-checkbox-label">
                  <input
                    type="radio"
                    name="req-type"
                    checked={selectedOption === 0}
                    onChange={() => setSelectedOption(0)} />
                  <span className="modal-req-checkmark"></span>
                  <span className='text'>Normal</span>
                </label>
                <div className='modal-req-checkbox-item'>
                  <label className="modal-req-checkbox-label">
                    <input
                      type="radio"
                      name="req-type"
                      checked={selectedOption === 1}
                      onChange={() => setSelectedOption(1)} />
                    <span className="modal-req-checkmark"></span>
                    <span className='text'>Diferencial</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <button type='button' className='modal-req-close-btn' onClick={() => handleModalChange('')}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className='modal-req-body'>
          <div className='modal-req-container'>

            <div className='modal-req-row-0'>
              {companies.length > 1 && (
              <div className='modal-req-select-field'>
                <label className='modal-req-label'>Empresa</label>
                <select
                  className='modal-req-select'
                  value={selectedCompany}
                  onChange={(e) => handleCompanyChange(Number(e.target.value))}
                >
                  <option value={0}>Selecciona Empresa</option>
                  {companies.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              )}
              {branchOffices.length > 1 && (
              <div className='modal-req-select-field'>
                <label className='modal-req-label'>Sucursal</label>
                <select
                  className='modal-req-select'
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(Number(e.target.value))}
                  disabled={!selectedCompany}
                >
                  <option value={0}>Selecciona Sucursal</option>
                  {branchOffices.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              )}
              <div className='modal-req-select-field'>
                <label className='modal-req-label'>Area</label>
                <select
                  className='modal-req-select'
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(Number(e.target.value))}
                  disabled={!selectedBranch}
                >
                  <option value={0}>Selecciona Area</option>
                  {areas.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className='modal-req-select-field'>
                <label className='modal-req-label'>Urgencia</label>
                <select
                  className='modal-req-select'
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                >
                  <option value='LOW'>Baja</option>
                  <option value='NORMAL'>Normal</option>
                  <option value='HIGH'>Alta</option>
                  <option value='URGENT'>Urgente</option>
                </select>
              </div>
              <div className='modal-req-select-field'>
                <label className='modal-req-label'>Título</label>
                <input
                  className='modal-req-inputs'
                  type='text'
                  value={fields.title}
                  onChange={(e) => setFields(prev => ({ ...prev, title: e.target.value }))}
                  placeholder='Ingresa el título'
                />
              </div>
            </div>

            <div className='modal-req-row-1'>
              <div className='modal-req-main-fields'>
                <div className='modal-req-field-group'>
                  <div className='modal-req-input-field'>
                    <label className='modal-req-label'>Comentario</label>
                    <textarea
                      className='modal-req-textarea'
                      value={fields.comments}
                      onChange={(e) => setFields(prev => ({ ...prev, comments: e.target.value }))}
                      placeholder='Comentarios generales'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className='modal-req-search-area'>
              <div className='modal-req-search-box'>
                <div className='modal-req-search-controls'>
                  <div className='modal-req-select-wrap'>
                    <label className='modal-req-label'>Buscar por</label>
                    <select
                      className='modal-req-select'
                      value={searchState.type}
                      onChange={(e) => setSearchState(prev => ({ ...prev, type: Number(e.target.value) }))}
                    >
                      <option value={1}>Código</option>
                      <option value={2}>Nombre</option>
                    </select>
                  </div>
                  <div className='modal-req-input-wrap'>
                    <label className='modal-req-label'>Término de búsqueda</label>
                    <div className='modal-req-input-with-icon'>
                      <span className="material-symbols-rounded">search</span>
                      <input
                        className='modal-req-inputs modal-req-search-input'
                        placeholder='Escribe para buscar...'
                        value={searchState.field}
                        type='text'
                        onChange={(e) => {
                          const val = e.target.value
                          setSearchState(prev => ({ ...prev, field: val }))
                          handleSearchChange(val)
                        }}
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className='modal-req-results-list'>
                        {searchResults.map((product: any) => (
                          <button
                            type='button'
                            key={product.id}
                            className='modal-req-result-item'
                            onClick={() => addItem(product)}
                          >
                            <div className="modal-req-result-info">
                              <span className="modal-req-result-name">{product.name}</span>
                              <span className="modal-req-result-code">{product.code}</span>
                            </div>
                            <img src={product.images?.[0] || ''} alt='' className='modal-req-result-img' onError={(e: any) => e.target.style.display = 'none'} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className='modal-req-tmp-field'>
                    <label className='modal-req-label'>Artículo Temporal</label>
                    <div className='modal-req-tmp-input-wrap'>
                      <input
                        className='modal-req-inputs'
                        type='text'
                        value={articuloTemporal}
                        onChange={(e) => setArticuloTemporal(e.target.value)}
                        placeholder='Descripción artículo temporal'
                      />
                      <button type='button' className='modal-req-btn-add-tmp' onClick={agregarTmp}>
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='modal-req-items-table'>
              <div className='modal-req-table-head'>
                <div className='modal-req-thead'>
                  <div className='modal-req-th modal-req-td-left' style={{ flex: 3 }}>Artículos</div>
                  <div className='modal-req-th' style={{ flex: 1 }}>Cantidad</div>
                  <div className='modal-req-th' style={{ flex: 1 }}>Unidad</div>
                  <div className='modal-req-th' style={{ flex: 1 }}>Almacén</div>
                  <div className='modal-req-th' style={{ flex: 2 }}>Comentarios</div>
                  <div className='modal-req-th' style={{ width: '50px' }}></div>
                </div>
              </div>
              <div className='modal-req-table-body'>
                {items.length > 0 ? (
                  items.map((item) => (
                    <div className='modal-req-table-row-wrap' key={item.key}>
                      <div className='modal-req-table-row'>
                        <div className='modal-req-td modal-req-td-left' style={{ flex: 3 }}>
                          <p className='modal-req-item-id'>{item.code} - {item.name}</p>
                        </div>
                        <div className='modal-req-td' style={{ flex: 1 }}>
                          <input
                            className='modal-req-inputs'
                            value={item.quantity}
                            onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                            type="number"
                          />
                        </div>
                        <div className='modal-req-td' style={{ flex: 1 }}>
                          <select
                            className='modal-req-traditional-select'
                            value={item.unitId}
                            onChange={(e) => updateItem(item.key, { unitId: Number(e.target.value) })}
                          >
                            {item.units.map((u: any) => (
                              <option key={u.id} value={u.unit?.id ?? u.id}>{u.unit?.name || u.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className='modal-req-td' style={{ flex: 1 }}>
                          <select
                            className='modal-req-traditional-select'
                            value={item.storeId}
                            onChange={(e) => updateItem(item.key, { storeId: Number(e.target.value) })}
                          >
                            {item.stores.map((s: any) => (
                              <option key={s.id} value={s.storeId || s.id}>{s.store?.name || s.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className='modal-req-td' style={{ flex: 2 }}>
                          <input
                            className='modal-req-inputs'
                            value={item.comments}
                            onChange={(e) => updateItem(item.key, { comments: e.target.value })}
                            type="text"
                            placeholder='Comentario...'
                          />
                        </div>
                        <div className='modal-req-td modal-req-td-delete' style={{ width: '50px' }}>
                          <div className='modal-req-delete-btn' onClick={() => removeItem(item.key)} title='Eliminar concepto'>
                            <span className="material-symbols-rounded">delete</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='modal-req-empty-state'>No hay artículos agregados.</div>
                )}
              </div>
            </div>
          </div>

          <footer className="modal-req-footer">
            <button type='button' className='modal-req-btn-cancel' onClick={() => handleModalChange('')}>
              Cancelar
            </button>
            <button
              type='button'
              className='modal-req-btn-save'
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Crear Requisición'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default ModalRequisition
