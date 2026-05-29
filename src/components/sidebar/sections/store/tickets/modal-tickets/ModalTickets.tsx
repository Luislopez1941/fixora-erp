import React, { useEffect, useState } from 'react';
import './ModalTickets.css';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';
import CategoriesStorePicker from '../../../categories/CategoriesStorePicker';
import { readCategoryBranchId } from '../../../../../../constants/category';

const LS_COMPANY = 'categories-picker-company-id';

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY));
  return !Number.isNaN(id) && id > 0 ? id : null;
};

const getStoreLabel = (store: any): string => {
  const name = store?.name?.trim?.() ?? ''
  if (name) return name
  const branchName = store?.branchName?.trim?.() ?? ''
  if (branchName) return branchName
  const companyName = store?.companyName?.trim?.() ?? ''
  if (companyName) return companyName
  return 'Almacén'
}

const getProductStores = (product: any) => {
  if (Array.isArray(product?.stores) && product.stores.length > 0) {
    return product.stores
  }
  return (product?.productStores ?? []).map((ps: any) => ({
    id: ps.store?.id ?? ps.storeId,
    storeId: ps.storeId ?? ps.store?.id,
    name: ps.store?.name ?? '',
    branchName: ps.store?.branchName ?? null,
    companyName: ps.store?.companyName ?? null,
  }))
}

const getVariationColors = (variations: any[]) => {
  const seen = new Map<string, { color: string; colorHex?: string }>()
  for (const v of variations ?? []) {
    if (!seen.has(v.color)) {
      seen.set(v.color, { color: v.color, colorHex: v.colorHex })
    }
  }
  return Array.from(seen.values())
}

const getSizesForColor = (variations: any[], color: string) =>
  (variations ?? []).filter((v) => v.color === color)

const resolveVariation = (
  variations: any[],
  color: string | null,
  size: string | null,
) => {
  if (!color || !size) return null
  return variations.find((v) => v.color === color && v.size === size) ?? null
}

const getStoreStockRow = (product: any, storeId: number) =>
  (product?.stockByStore ?? []).find(
    (row: any) => Number(row.storeId) === Number(storeId),
  )

const getVariationStockForStore = (
  product: any,
  storeId: number,
  color?: string | null,
  size?: string | null,
) => {
  if (!product?.usesSizes) {
    const storeRow = getStoreStockRow(product, storeId)
    return storeRow?.totalStock ?? product?.totalStock ?? 0
  }

  const storeRow = getStoreStockRow(product, storeId)
  const pool = storeRow?.variations ?? product?.variations ?? []

  if (color && size) {
    const match = pool.find((v: any) => v.color === color && v.size === size)
    return match?.stock ?? 0
  }

  return null
}

const getProductVariations = (product: any) =>
  product?.usesSizes ? (product.variations ?? product.itemVariations ?? []) : []

const groupVariationsByColorForDisplay = (product: any) => {
  const map = new Map<string, { color: string; colorHex?: string; sizes: string[] }>()

  for (const v of getProductVariations(product)) {
    if (!map.has(v.color)) {
      map.set(v.color, { color: v.color, colorHex: v.colorHex, sizes: [] })
    }
    map.get(v.color)!.sizes.push(v.size)
  }

  return Array.from(map.values())
}

const ProductVariationsPreview: React.FC<{ product: any; compact?: boolean }> = ({
  product,
  compact = false,
}) => {
  const groups = groupVariationsByColorForDisplay(product)
  if (!product?.usesSizes || groups.length === 0) return null

  const storeId = product?.stores?.[0]?.id ?? product?.stores?.[0]?.storeId

  return (
    <div className={`tickets-variations-preview${compact ? ' tickets-variations-preview--compact' : ''}`}>
      {groups.map((group) => (
        <div key={group.color} className='tickets-variations-preview__row'>
          {group.colorHex ? (
            <span
              className='tickets-variations-preview__swatch'
              style={{ backgroundColor: group.colorHex }}
              title={group.color}
            />
          ) : null}
          <span className='tickets-variations-preview__color'>{group.color}</span>
          <span className='tickets-variations-preview__sizes'>
            Tallas:{' '}
            {group.sizes
              .map((size) => {
                const stock = getVariationStockForStore(product, storeId, group.color, size)
                return stock != null ? `${size} (${stock})` : size
              })
              .join(', ')}
          </span>
        </div>
      ))}
    </div>
  )
}

const ModalTickets: React.FC<{ onSaved?: () => void; selectedTicket?: any | null }> = ({
  onSaved,
  selectedTicket,
}) => {
  const userState = useSelector((store: any) => store.user);
  const dispatch = useDispatch();
  const modalState = useSelector((state: any) => state.modals);
  const isUpdate = modalState === 'tickets_modal_update';
  const isOpen = modalState === 'tickets_modal' || isUpdate;
  const [branchId, setBranchId] = useState(() => readCategoryBranchId());
  const [comments, setComments] = useState('');
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  const resolveNames = async (companyId: number, selectedBranchId: number) => {
    const companiesRes: any = await APIs.getCompanies(userState.id);
    const companies = companiesRes?.data ?? [];
    const company = companies.find((c: any) => c.id === companyId);
    let branchName = 'Sin sucursal';

    if (selectedBranchId > 0) {
      const branchRes: any = await APIs.getBranch({ userId: userState.id, companyId });
      const branches = branchRes?.data ?? [];
      const branchItem = branches.find((b: any) => b.id === selectedBranchId);
      branchName = branchItem?.name ?? branchName;
    }

    return {
      companyName: company?.name ?? '',
      branchName,
    };
  };

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
    // dispatch(updateAdministrator('reset'));
  };

  const [selectAdd, setSelectAdd] = useState<any>({
    types: [
      {
        id: 1,
        name: 'Codigo'
      },
      {
        id: 2,
        name: 'Nombre'
      }
    ],
    selectType: null,
    selectedType: null,
    selectResult: null,
    selectedResult: '',
    result: [],
    field: ''
  })

  const [concepts, setConcepts] = useState<any>([])

  useEffect(() => {
    if (!isOpen) {
      setEditingTicketId(null);
      return;
    }

    if (isUpdate && selectedTicket?.id) {
      let cancelled = false;
      setLoadingTicket(true);

      (async () => {
        try {
          const response: any = await APIs.getTicketById(selectedTicket.id);
          const ticket = response?.data;
          if (cancelled || !ticket) return;

          localStorage.setItem(LS_COMPANY, String(ticket.companyId));
          localStorage.setItem('categories-picker-branch-id', String(ticket.branchId));
          setBranchId(Number(ticket.branchId) || 0);
          setComments(ticket.comments ?? '');
          setEditingTicketId(ticket.id);
          setConcepts(
            (ticket.concepts ?? []).map((c: any) => ({
              code: c.code,
              name: c.name,
              productId: c.productId,
              quantity: c.quantity,
              unitId: c.unitId,
              storeId: c.storeId,
              usesSizes: c.usesSizes === true,
              variations: c.variations ?? [],
              selectedColor: c.variationColor ?? '',
              selectedSize: c.variationSize ?? '',
              itemVariationId: c.itemVariationId ?? null,
              variationColor: c.variationColor ?? null,
              variationSize: c.variationSize ?? null,
              variationColorHex: c.variationColorHex ?? null,
              stores: c.stores ?? [],
              units: c.units ?? [],
            })),
          );
          setSelectAdd({
            types: [
              { id: 1, name: 'Codigo' },
              { id: 2, name: 'Nombre' },
            ],
            selectType: null,
            selectedType: null,
            selectResult: null,
            selectedResult: '',
            result: [],
            field: '',
          });
        } catch (error) {
          console.error('Error al cargar entrada:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la entrada para editar.',
          });
          dispatch(modal(''));
        } finally {
          if (!cancelled) setLoadingTicket(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    setEditingTicketId(null);
    setBranchId(readCategoryBranchId());
    setComments('');
    setConcepts([]);
    setSelectAdd({
      types: [
        { id: 1, name: 'Codigo' },
        { id: 2, name: 'Nombre' },
      ],
      selectType: null,
      selectedType: null,
      selectResult: null,
      selectedResult: '',
      result: [],
      field: '',
    });
  }, [isOpen, isUpdate, selectedTicket?.id, dispatch]);

  const openSelectType = () => {
    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectType: !prevState.selectType,
    }));
  }

  const handleTypeChange = async (type: any) => {
    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectType: !prevState.selectType,
    }));

    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectedType: type.id,
    }));
  }

  const openSelectResult = () => {
    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectResult: !prevState.selectResult
    }));
  }

  const handleResultChange = (result: any) => {
    setSelectAdd((prevState: any) => ({
      ...prevState,
      selectResult: !prevState.selectResult,
      selectedResult: result
    }));
  }

  const search = async () => {
    try {
      const companyId = readCompanyId();
      if (!companyId) {
        Swal.fire({
          icon: 'warning',
          title: 'Empresa requerida',
          text: 'Selecciona una empresa antes de buscar artículos.',
          confirmButtonColor: '#3085d6',
        });
        return;
      }

      const filters = {
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
      };
      if (selectAdd.selectedType == 1) {
        const response: any = await APIs.getProducts(selectAdd.field, '', undefined, filters);
        setSelectAdd((prevState: any) => ({
          ...prevState,
          result: response.data
        }));
      }
      if (selectAdd.selectedType == 2) {
        const response: any = await APIs.getProducts('', selectAdd.field, undefined, filters);
        setSelectAdd((prevState: any) => ({
          ...prevState,
          result: response.data
        }));
      }

    } catch (error) {
      console.error('Error al obtener los productos:', error);
    }
  }

  const saveTicket = async () => {
    const companyId = readCompanyId();

    if (!companyId) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Selecciona empresa y sucursal antes de guardar la entrada.',
        confirmButtonColor: '#3085d6',
      })
      return
    }

    if (concepts.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin conceptos',
        text: 'Agrega al menos un artículo a la entrada.',
        confirmButtonColor: '#3085d6',
      })
      return
    }

    const invalidConcept = concepts.find(
      (c: any) =>
        !Number(c.productId) ||
        !Number(c.quantity) ||
        Number(c.quantity) <= 0 ||
        !Number(c.unitId) ||
        !Number(c.storeId) ||
        (c.usesSizes && !c.itemVariationId),
    )

    if (invalidConcept) {
      Swal.fire({
        icon: 'warning',
        title: 'Concepto incompleto',
        text: invalidConcept.usesSizes && !invalidConcept.itemVariationId
          ? 'Selecciona color y talla en cada artículo que usa variaciones.'
          : 'Revisa cantidad, unidad y almacén de cada artículo.',
        confirmButtonColor: '#3085d6',
      })
      return
    }

    try {
      const { companyName, branchName } = await resolveNames(companyId, branchId);

      const payload = {
        companyId,
        companyName,
        branchId,
        branchName,
        comments: comments || '',
        concepts: concepts.map((c: any) => ({
          productId: Number(c.productId),
          quantity: Math.trunc(Number(c.quantity)),
          unitId: Number(c.unitId),
          storeId: Number(c.storeId),
          itemVariationId: c.itemVariationId ? Number(c.itemVariationId) : undefined,
          code: c.code,
          name: c.name,
        })),
      };

      let response: any;
      if (isUpdate && editingTicketId) {
        response = await APIs.updateTicket(editingTicketId, payload);
      } else {
        response = await APIs.cresteTickets({
          ...payload,
          userId: Number(userState.id),
        });
      }

      Swal.fire({
        icon: 'success',
        title: isUpdate ? 'Entrada actualizada' : 'Entrada creada',
        text: response.message,
        confirmButtonColor: '#3085d6',
      })
      dispatch(modal(''))
      onSaved?.()
    } catch (error: any) {
      console.error('Error al guardar la entrada:', error)
      Swal.fire({
        icon: 'error',
        title: isUpdate ? 'Error al actualizar la entrada' : 'Error al crear la entrada',
        text: error.response?.data?.message || 'Ocurrió un error inesperado',
        confirmButtonColor: '#d33',
      })
    }
  }


  const applyVariationSelection = (concept: any, color: string, size: string) => {
    const variation = resolveVariation(concept.variations ?? [], color || null, size || null)
    const colorMeta = getVariationColors(concept.variations ?? []).find((c) => c.color === color)

    return {
      ...concept,
      selectedColor: color,
      selectedSize: size,
      itemVariationId: variation?.id ?? null,
      variationColor: color || null,
      variationSize: size || null,
      variationColorHex: colorMeta?.colorHex ?? variation?.colorHex ?? null,
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const color = e.target.value
    setConcepts(
      concepts.map((concept: any, i: number) => {
        if (i !== index) return concept
        const sizes = color ? getSizesForColor(concept.variations ?? [], color) : []
        const size = sizes.length === 1 ? sizes[0].size : ''
        return applyVariationSelection(concept, color, size)
      }),
    )
  }

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const size = e.target.value
    setConcepts(
      concepts.map((concept: any, i: number) =>
        i === index
          ? applyVariationSelection(concept, concept.selectedColor ?? '', size)
          : concept,
      ),
    )
  }

  const renderVariationCells = (item: any, index: number) => {
    if (!item.usesSizes) {
      const stock = getVariationStockForStore(item, item.storeId)
      return (
        <>
          <div className='td td--color tickets-variation-empty'>
            <span>—</span>
          </div>
          <div className='td td--size tickets-variation-empty'>
            <span>—</span>
            {stock != null ? (
              <span className='tickets-stock-hint'>Exist: {stock}</span>
            ) : null}
          </div>
        </>
      )
    }

    const colors = getVariationColors(item.variations ?? [])
    const sizes = item.selectedColor
      ? getSizesForColor(item.variations ?? [], item.selectedColor)
      : []
    const selectedStock = getVariationStockForStore(
      item,
      item.storeId,
      item.selectedColor,
      item.selectedSize,
    )

    return (
      <>
        <div className='td td--color'>
          <select
            className='traditional__selector tickets-entry-select'
            value={item.selectedColor ?? ''}
            onChange={(e) => handleColorChange(e, index)}
          >
            <option value=''>Color</option>
            {colors.map((c) => (
              <option key={c.color} value={c.color}>
                {c.color}
              </option>
            ))}
          </select>
        </div>
        <div className='td td--size'>
          <select
            className='traditional__selector tickets-entry-select'
            value={item.selectedSize ?? ''}
            onChange={(e) => handleSizeChange(e, index)}
            disabled={!item.selectedColor}
          >
            <option value=''>Talla</option>
            {sizes.map((v: any) => {
              const sizeStock = getVariationStockForStore(
                item,
                item.storeId,
                item.selectedColor,
                v.size,
              )
              return (
                <option key={v.id} value={v.size}>
                  {sizeStock != null ? `${v.size} (${sizeStock})` : v.size}
                </option>
              )
            })}
          </select>
          {selectedStock != null && item.selectedColor && item.selectedSize ? (
            <span className='tickets-stock-hint'>
              Exist: {selectedStock} · {item.selectedColor} · {item.selectedSize}
            </span>
          ) : null}
        </div>
      </>
    )
  }

  const addTickets = () => {
    const product = selectAdd.selectedResult
    if (!product?.id) return

    const usesSizes = product.usesSizes === true
    const variations = usesSizes ? (product.variations ?? product.itemVariations ?? []) : []
    const colors = getVariationColors(variations)
    const initialColor = colors.length === 1 ? colors[0].color : ''
    const sizes = initialColor ? getSizesForColor(variations, initialColor) : []
    const initialSize = sizes.length === 1 ? sizes[0].size : ''
    const selectedVariation = resolveVariation(
      variations,
      initialColor || null,
      initialSize || null,
    )

    const stores = getProductStores(product)
    const units = product.productUnits ?? []

    const data = {
      code: product.code,
      name: product.name,
      productId: product.id,
      quantity: 0,
      unitId: units[0]?.unitId ?? units[0]?.unit?.id ?? 0,
      storeId: stores[0]?.storeId ?? stores[0]?.id ?? 0,
      usesSizes,
      variations,
      selectedColor: initialColor,
      selectedSize: initialSize,
      itemVariationId: selectedVariation?.id ?? null,
      variationColor: selectedVariation?.color ?? null,
      variationSize: selectedVariation?.size ?? null,
      variationColorHex: selectedVariation?.colorHex ?? null,
      stores,
      units,
      totalStock: product.totalStock ?? 0,
      generalStock: product.generalStock ?? 0,
      stockStatus: product.stockStatus ?? null,
      stockByStore: product.stockByStore ?? [],
    }
    setConcepts([...concepts, data])
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.trim()
    const parsedValue = value === '' ? null : Number(value)

    const updatedConcepts = concepts.map((concept: any, i: number) =>
      i === index ? { ...concept, quantity: parsedValue } : concept
    )

    setConcepts(updatedConcepts)
  }


  const handlUnitsChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const value = Number(e.target.value)
    const updatedConcepts = concepts.map((concept: any, i: number) =>
      i === index ? { ...concept, unitId: value } : concept
    )
    setConcepts(updatedConcepts)
  }

  const handlStoreChange = (e: React.ChangeEvent<HTMLSelectElement>, index: number) => {
    const value = Number(e.target.value)
    const updatedConcepts = concepts.map((concept: any, i: number) =>
      i === index ? { ...concept, storeId: value } : concept
    )
    setConcepts(updatedConcepts)
  }


  const deleteBranch = (_: any, i: number) => {
    let filter = concepts.filter((_: any, index: any) => index !== i)
    setConcepts(filter)
  }

  const getSelectedResultLabel = (): string => {
    const selected = selectAdd.selectedResult
    if (!selected?.id) return 'Selecciona artículo'
    const item = selectAdd.result?.find((s: any) => s.id === selected.id) ?? selected
    return item.code ? `${item.code} · ${item.name}` : item.name
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      search()
    }
  }

  return (
    <div className={`overlay__tickets_modal ${isOpen ? 'active' : ''}`}>
      <div className={`popup__tickets_modal ${isOpen ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href="#" className="btn-cerrar-popup__tickets_modal" onClick={() => handleModalChange('')}>
            <svg className='svg__close' xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </a>
          <p className='title__modals'>
            {isUpdate ? 'Editar entrada' : 'Nueva entrada'}
          </p>
        </div>
        <div className='tickets_modal'>
          <div className='tickets_modal_container'>
            <div className='tickets-meta-row'>
              <CategoriesStorePicker
                variant='modal'
                branchId={branchId}
                onBranchIdChange={(id) => {
                  setBranchId(id);
                  localStorage.setItem('categories-store-id', String(id));
                }}
              />
              <div className='tickets-meta-comments'>
                <label className='label__general'>Comentarios</label>
                <input
                  className='inputs__general tickets-meta-input'
                  type='text'
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder='Opcional'
                />
              </div>
            </div>
            <div className='tickets-add-panel'>
              <div className='tickets-add-toolbar'>
                <div className='tickets-add-field tickets-add-field--type'>
                  <div className='select__container tickets-add-select'>
                    <div className='select-btn__general'>
                      <div className={`select-btn ${selectAdd.selectType ? 'active' : ''}`} onClick={openSelectType}>
                        <p>{selectAdd.selectedType !== null ? selectAdd?.types.find((s: { id: number }) => s.id === selectAdd.selectedType)?.name : 'Tipo'}</p>
                        <svg className='chevron__down' xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                      </div>
                      <div className={`content ${selectAdd.selectType ? 'active' : ''}`}>
                        <ul className={`options ${selectAdd.selectType ? 'active' : ''}`} style={{ opacity: selectAdd.selectType ? '1' : '0' }}>
                          {selectAdd?.types?.map((type: any) => (
                            <li key={type.id} onClick={() => handleTypeChange(type)}>
                              {type.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <input
                  className='inputs__general tickets-add-input'
                  type='text'
                  value={selectAdd.field}
                  onChange={(e) => setSelectAdd({ ...selectAdd, field: e.target.value })}
                  onKeyDown={handleSearchKeyDown}
                  placeholder='Código o nombre'
                />

                <button
                  type='button'
                  className='btn__general-primary tickets-add-btn'
                  onClick={search}
                >
                  Buscar
                </button>

                <div className='tickets-add-field tickets-add-field--result'>
                  <div className='select__container tickets-add-select'>
                    <div className='select-btn__general'>
                      <div className={`select-btn ${selectAdd.selectResult ? 'active' : ''}`} onClick={openSelectResult}>
                        <p className='tickets-add-result-label'>{getSelectedResultLabel()}</p>
                        <svg className='chevron__down' xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" /></svg>
                      </div>
                      <div className={`content ${selectAdd.selectResult ? 'active' : ''}`}>
                        <ul className={`options tickets-search-results ${selectAdd.selectResult ? 'active' : ''}`} style={{ opacity: selectAdd.selectResult ? '1' : '0' }}>
                          {selectAdd?.result?.length > 0 ? (
                            selectAdd.result.map((result: any) => (
                              <li
                                key={result.id}
                                className='tickets-search-result'
                                onClick={() => handleResultChange(result)}
                              >
                                <span className='tickets-search-result__name'>
                                  {result.code ? `${result.code} · ` : ''}
                                  {result.name}
                                </span>
                                <ProductVariationsPreview product={result} compact />
                                {!result.usesSizes ? (
                                  <span className='tickets-search-result__no-sizes'>Sin tallas</span>
                                ) : null}
                              </li>
                            ))
                          ) : (
                            <li className='tickets-search-result tickets-search-result--empty'>
                              Sin resultados
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type='button'
                  className='btn__general-primary tickets-add-btn'
                  onClick={addTickets}
                  disabled={!selectAdd.selectedResult?.id}
                >
                  Agregar
                </button>

                <span className='tickets-add-count'>{concepts.length}</span>
              </div>
            </div>
            <div className='table__tickets_modal tickets-entry-table'>
              <div className='tickets-entry-table__scroll'>
              <div className='table__head'>
                <div className='thead'>
                  <div className='th th--name'>
                    <p>Codigo / Nombre</p>
                  </div>
                  <div className='th th--qty'>
                    <p>Cantidad</p>
                  </div>
                  <div className='th th--color'>
                    <p>Color</p>
                  </div>
                  <div className='th th--size'>
                    <p>Talla</p>
                  </div>
                  <div className='th th--unit'>
                    <p>Unidad</p>
                  </div>
                  <div className='th th--store'>
                    <p>Almacén</p>
                  </div>
                  <div className='th th--actions'>
                    <p>Acciones</p>
                  </div>
                </div>
              </div>
              {concepts?.length > 0 ? (
                <div className='table__body'>
                  {concepts?.map((item: any, index: any) => (
                    <div className='tbody__container' key={index}>
                      <div className='tbody-desk'>
                        <div className='td td--name'>
                          <p className='code-identifier tickets-entry-code'>{item.code}-{item.name}</p>
                        </div>
                        <div className='td td--qty'>
                          <input className='inputs__general tickets-entry-qty' type='text' value={item.quantity === null ? '' : item.quantity} onChange={(e) => handleAmountChange(e, index)} placeholder='0' />
                        </div>
                        {renderVariationCells(item, index)}
                        <div className='td td--unit'>
                          <select className='traditional__selector tickets-entry-select' onChange={(event) => handlUnitsChange(event, index)} value={item.unitId} >
                            {item.units?.map((unitRow: any) => (
                              <option key={unitRow.id} value={unitRow.unitId ?? unitRow.unit?.id}>
                                {unitRow.unit?.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className='td td--store'>
                          <select className='traditional__selector tickets-entry-select' onChange={(event) => handlStoreChange(event, index)} value={item.storeId} >
                            {item.stores?.map((store: any) => (
                              <option key={store.id} value={store.storeId ?? store.id}>
                                {getStoreLabel(store)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className='td td--actions'>
                          <button
                            type='button'
                            className='delete-icon tickets-entry-action'
                            onClick={() => deleteBranch(item, index)}
                            title='Eliminar línea'
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className='tbody-response'>
                        <div className='td td--name td--full'>
                          <p className='code-identifier tickets-entry-code'>{item.code}-{item.name}</p>
                        </div>
                        <div className='td td--qty'>
                          <label className='tickets-entry-mobile-label'>Cantidad</label>
                          <input className='inputs__general tickets-entry-qty' type='text' value={item?.quantity === null ? '' : item?.quantity} onChange={(e) => handleAmountChange(e, index)} placeholder='0' />
                        </div>
                        {renderVariationCells(item, index)}
                        <div className='td td--unit'>
                          <label className='tickets-entry-mobile-label'>Unidad</label>
                          <select className='traditional__selector tickets-entry-select' onChange={(event) => handlUnitsChange(event, index)} value={item.unitId} >
                            {item.units?.map((unitRow: any) => (
                              <option key={unitRow.id} value={unitRow.unitId ?? unitRow.unit?.id}>
                                {unitRow.unit?.name}
                              </option>
                            ))}
                          </select>

                        </div>

                        <div className='td td--store'>
                          <label className='tickets-entry-mobile-label'>Almacén</label>
                          <select className='traditional__selector tickets-entry-select' onChange={(event) => handlStoreChange(event, index)} value={item.storeId} >
                            {item.stores?.map((store: any) => (
                              <option key={store.id} value={store.storeId ?? store.id}>
                                {getStoreLabel(store)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className='td td--actions td--full'>
                          <button
                            type='button'
                            className='delete-icon tickets-entry-action'
                            onClick={() => deleteBranch(item, index)}
                            title='Eliminar línea'
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-filled icon-tabler-trash"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16z" /><path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text'>No hay máximos y mínimos que mostrar</p>
              )}
              </div>
            </div>
          </div>
          <div className='row__three'>
            <button
              className='btn__general-primary'
              onClick={saveTicket}
              disabled={loadingTicket}
            >
              {loadingTicket
                ? 'Cargando...'
                : isUpdate
                  ? 'Guardar cambios'
                  : 'Crear entrada'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTickets;
