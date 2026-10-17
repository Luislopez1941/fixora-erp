import React, { useEffect, useRef, useState } from 'react';
import './ModalTickets.css';
import { useDispatch, useSelector } from "react-redux";
import { modal } from '../../../../../../redux/state/modals';
import APIs from '../../../../../../services/APIs';
import Swal from 'sweetalert2';
import CategoriesStorePicker from '../../../catalogos/categories/CategoriesStorePicker';
import { readCategoryBranchId } from '../../../../../../constants/category';
import DateField, { type DatePreset } from '../../../../../general/date-field/DateField'

// Atajos de caducidad: lo más común al recibir mercancía perecedera
const EXPIRY_PRESETS: DatePreset[] = [
  { label: '1 mes', months: 1 },
  { label: '3 meses', months: 3 },
  { label: '6 meses', months: 6 },
  { label: '1 año', months: 12 },
  { label: '2 años', months: 24 },
]

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
  // Guardado: 'saving' mientras se envía (evita doble clic y entradas duplicadas) y 'done' un momento con el botón en verde
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'done'>('idle');

  const resolveNames = async (companyId: number, selectedBranchId: number) => {
    try {
      const companyRes: any = await APIs.getCompanyById(companyId);
      const company = companyRes?.data;
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
    } catch (error) {
      console.error('Error resolving names:', error);
      return { companyName: '', branchName: 'Sin sucursal' };
    }
  };

  const handleModalChange = (value: any) => {
    dispatch(modal(value));
    // dispatch(updateAdministrator('reset'));
  };

  // Buscador de artículos: una sola caja (código, código de barras o nombre) con resultados al escribir
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [finderOpen, setFinderOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [addingId, setAddingId] = useState<number | null>(null)
  const [branchStores, setBranchStores] = useState<any[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchSeq = useRef(0)
  const resultsFor = useRef('') // texto al que corresponden los resultados que se muestran

  const [concepts, setConcepts] = useState<any>([])

  useEffect(() => {
    setSaveState('idle');
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
              lotCode: c.lotCode ?? '',
              expiryDate: c.expiryDate ?? '',
            })),
          );
          resetFinder();
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
          resetFinder();
  }, [isOpen, isUpdate, selectedTicket?.id, dispatch]);

  const resetFinder = () => {
    setQuery('')
    setResults([])
    setFinderOpen(false)
    setActiveIndex(0)
  }

  // Almacenes de la sucursal para el selector de cada línea: no dependen de a qué almacén esté ligado el artículo
  useEffect(() => {
    if (!isOpen) return
    const companyId = readCompanyId()
    if (!companyId) {
      setBranchStores([])
      return
    }
    let alive = true
    APIs.getWarehouses({ companyId, branchId: branchId > 0 ? branchId : undefined })
      .then((r: any) => {
        if (alive) setBranchStores(Array.isArray(r) ? r : r?.data ?? [])
      })
      .catch(() => alive && setBranchStores([]))
    return () => {
      alive = false
    }
  }, [isOpen, branchId])

  // Un código parece "código" si empieza con pocas letras y tiene números (ABR-00010, 7501…); si no, se busca por nombre.
  // Si el primer intento no encuentra nada se prueba el otro modo, así una sola caja sirve para todo.
  const fetchRows = async (term: string): Promise<any[]> => {
    const companyId = readCompanyId()
    if (!companyId || branchId <= 0) return []
    const looksLikeCode = /^[A-Za-z]{0,5}-?\d[\w-]*$/.test(term)
    const run = async (mode: 'code' | 'name') => {
      const res: any = await APIs.searchProducts(mode, term, { companyId, branchId })
      return (res?.data ?? []) as any[]
    }
    const first = await run(looksLikeCode ? 'code' : 'name')
    return first.length ? first : run(looksLikeCode ? 'name' : 'code')
  }

  // Búsqueda al escribir (con una pausa corta); una respuesta vieja nunca pisa a una nueva
  useEffect(() => {
    const term = query.trim()
    if (!isOpen || !term) {
      setResults([])
      setSearching(false)
      return
    }
    const seq = ++searchSeq.current
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const rows = await fetchRows(term)
        if (seq !== searchSeq.current) return
        resultsFor.current = term
        setResults(rows)
        setActiveIndex(0)
      } catch (error) {
        if (seq === searchSeq.current) setResults([])
        console.error('Error al buscar artículos:', error)
      } finally {
        if (seq === searchSeq.current) setSearching(false)
      }
    }, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen, branchId])

  // Agrega el artículo elegido como una línea nueva (cantidad 1); si ya está (sin variaciones, misma unidad y almacén) suma 1
  const addProduct = async (hit: any) => {
    if (!hit?.id || addingId != null) return
    setAddingId(hit.id)
    try {
      const response: any = await APIs.getProductForSale(hit.id, { branchId: branchId > 0 ? branchId : undefined })
      const product = response?.data ?? response
      const usesSizes = product.usesSizes === true
      const variations = usesSizes ? (product.variations ?? product.itemVariations ?? []) : []
      const colors = getVariationColors(variations)
      const initialColor = colors.length === 1 ? colors[0].color : ''
      const sizes = initialColor ? getSizesForColor(variations, initialColor) : []
      const initialSize = sizes.length === 1 ? sizes[0].size : ''
      const selectedVariation = resolveVariation(variations, initialColor || null, initialSize || null)

      const units = product.productUnits ?? []
      const unitId = units.find((u: any) => u.predetermined)?.unitId ?? units[0]?.unitId ?? units[0]?.unit?.id ?? 0
      const lastStore = concepts.length ? concepts[concepts.length - 1].storeId : 0
      const productStores = getProductStores(product)
      const defaultStore =
        lastStore ||
        branchStores.find((st: any) => st.predetermined)?.id ||
        branchStores[0]?.id ||
        productStores[0]?.storeId ||
        productStores[0]?.id ||
        0

      const sameLine = !usesSizes
        ? concepts.findIndex((c: any) => c.productId === product.id && !c.usesSizes && Number(c.unitId) === Number(unitId) && Number(c.storeId) === Number(defaultStore))
        : -1
      if (sameLine >= 0) {
        setConcepts(concepts.map((c: any, i: number) => (i === sameLine ? { ...c, quantity: (Number(c.quantity) || 0) + 1 } : c)))
        return
      }

      setConcepts([
        ...concepts,
        {
          code: product.code,
          name: product.name,
          productId: product.id,
          quantity: 1,
          unitId,
          storeId: defaultStore,
          usesSizes,
          variations,
          selectedColor: initialColor,
          selectedSize: initialSize,
          itemVariationId: selectedVariation?.id ?? null,
          variationColor: selectedVariation?.color ?? null,
          variationSize: selectedVariation?.size ?? null,
          variationColorHex: selectedVariation?.colorHex ?? null,
          stores: productStores,
          units,
          lotCode: '',
          expiryDate: '',
          totalStock: product.totalStock ?? 0,
          generalStock: product.generalStock ?? 0,
          stockStatus: product.stockStatus ?? null,
          stockByStore: product.stockByStore ?? [],
        },
      ])
    } catch (error) {
      console.error('Error al agregar el artículo:', error)
      Swal.fire({ icon: 'error', title: 'No se pudo agregar', text: 'No pudimos cargar el artículo. Intenta de nuevo.', confirmButtonColor: '#3085d6' })
    } finally {
      setAddingId(null)
      resetFinder()
      searchInputRef.current?.focus()
    }
  }

  // Enter agrega: el código o código de barras exacto (lector de códigos) o, si no, el resultado resaltado
  const handleFinderKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFinderOpen(true)
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      setFinderOpen(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const term = query.trim()
      if (!term) return
      // Los resultados en pantalla solo valen si son de lo que está escrito (un lector de códigos escribe y da Enter casi a la vez)
      let rows = results
      if (searching || !rows.length || resultsFor.current !== term) {
        try {
          rows = await fetchRows(term)
        } catch {
          rows = []
        }
      }
      const lower = term.toLowerCase()
      const exact = rows.find((r) => String(r.barcode ?? '').toLowerCase() === lower || String(r.code ?? '').toLowerCase() === lower)
      const hit = exact ?? (resultsFor.current === term ? rows[activeIndex] : undefined) ?? rows[0]
      if (hit) addProduct(hit)
    }
  }

  const saveTicket = async () => {
    if (saveState !== 'idle') return;
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

    if (!userState?.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Usuario no autenticado',
        text: 'No pudimos encontrar tu ID de usuario. Por favor, reinicia sesión.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    try {
      setSaveState('saving');
      const { companyName, branchName } = await resolveNames(companyId, branchId || 0);

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
          itemVariationId: c.itemVariationId != null ? Number(c.itemVariationId) : null,
          code: c.code,
          name: c.name,
          ...(c.lotCode?.trim() ? { lotCode: c.lotCode.trim() } : {}),
          ...(c.expiryDate ? { expiryDate: c.expiryDate } : {}),
        })),
      };

      let response: any;
      if (isUpdate && editingTicketId) {
        response = await APIs.updateTicket(editingTicketId, payload);
      } else {
        response = await APIs.createTickets({
          ...payload,
          userId: Number(userState.id),
        });
      }

      // El botón confirma el resultado ("Entrada creada") un instante y luego se cierra el modal
      void response;
      setSaveState('done');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      dispatch(modal(''))
      onSaved?.()
    } catch (error: any) {
      setSaveState('idle');
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.trim()
    const parsedValue = value === '' ? null : Number(value)

    const updatedConcepts = concepts.map((concept: any, i: number) =>
      i === index ? { ...concept, quantity: parsedValue } : concept
    )

    setConcepts(updatedConcepts)
  }


  // Lote y caducidad de la línea (opcionales): al guardar la entrada crean el lote que verás en Caducidades
  const handleLotField = (index: number, field: 'lotCode' | 'expiryDate', value: string) => {
    setConcepts(concepts.map((concept: any, i: number) => (i === index ? { ...concept, [field]: value } : concept)))
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

  return (
    <div className={`overlay__store_tickets_modal ${isOpen ? 'active' : ''}`}>
      <div className={`popup__store_tickets_modal ${isOpen ? 'active' : ''}`}>
        <div className='header__modal'>
          <a href="#" className="btn-cerrar-popup__store_tickets_modal" onClick={() => handleModalChange('')}>
            <svg className='svg__close' xmlns="http://www.w3.org/2000/svg" height="16" width="12" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
          </a>
          <p className='title__modals'>
            {isUpdate ? 'Editar entrada' : 'Nueva entrada'}
          </p>
        </div>
        <div className='store_tickets_modal'>
          <div className='store_tickets_modal_container'>
            <div className='tickets-meta-row'>
              <CategoriesStorePicker
                variant='modal'
                branchId={branchId}
                onBranchIdChange={(id) => {
                  setBranchId(id);
                  localStorage.setItem('categories-store-id', String(id));
                }}
              />
              <div className='tickets-add-panel'>
                <label className='label__general'>Agregar artículo</label>
                <div className='tickets-add-row'>
                <div className='tickets-finder'>
                  <span className='tickets-finder__icon material-symbols-rounded' aria-hidden>search</span>
                  <input
                    ref={searchInputRef}
                    className='inputs__general tickets-finder__input'
                    type='text'
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setFinderOpen(true)
                    }}
                    onFocus={() => setFinderOpen(true)}
                    onBlur={() => setTimeout(() => setFinderOpen(false), 150)}
                    onKeyDown={handleFinderKeyDown}
                    placeholder={branchId > 0 ? 'Buscar por código, código de barras o nombre (Enter agrega)' : 'Elige una sucursal para buscar artículos'}
                    disabled={branchId <= 0}
                    autoComplete='off'
                    aria-label='Buscar artículo'
                  />
                  {searching && <span className='tickets-finder__spinner material-symbols-rounded' aria-hidden>progress_activity</span>}

                  {finderOpen && query.trim() && (
                    <ul className='tickets-finder__list' role='listbox'>
                      {results.length > 0 ? (
                        results.map((r: any, i: number) => {
                          const already = concepts.some((c: any) => c.productId === r.id)
                          return (
                            <li
                              key={r.id}
                              role='option'
                              aria-selected={i === activeIndex}
                              className={`tickets-finder__item ${i === activeIndex ? 'is-active' : ''}`}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => setActiveIndex(i)}
                              onClick={() => addProduct(r)}
                            >
                              <span className='tickets-finder__code'>{r.code || 's/c'}</span>
                              <span className='tickets-finder__name'>
                                <strong>{r.name}</strong>
                                <small>
                                  {[r.barcode, r.usesSizes ? 'Con tallas' : null].filter(Boolean).join(' · ')}
                                </small>
                              </span>
                              {already && <span className='tickets-finder__badge'>En la entrada</span>}
                              {addingId === r.id && <span className='tickets-finder__badge'>Agregando…</span>}
                            </li>
                          )
                        })
                      ) : (
                        <li className='tickets-finder__empty'>{searching ? 'Buscando…' : 'Sin resultados'}</li>
                      )}
                    </ul>
                  )}
                </div>
                <span className='tickets-add-count' title='Líneas en la entrada'>{concepts.length}</span>
                </div>
              </div>
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
            {/* Líneas de la entrada: mismo diseño de lista en filas del resto del sistema */}
            <div className={`tickets-lines ${concepts.some((c: any) => c.usesSizes) ? 'tickets-lines--variants' : ''}`}>
              <div className='tickets-lines__row tickets-lines__row--head'>
                <span>Artículo</span>
                <span>Cantidad</span>
                {concepts.some((c: any) => c.usesSizes) && <span>Color y talla</span>}
                <span>Unidad</span>
                <span>Almacén</span>
                <span>Lote</span>
                <span>Caduca</span>
                <span className='tickets-lines__col-actions' />
              </div>

              {concepts?.length > 0 ? (
                concepts.map((item: any, index: number) => {
                  const stock = !item.usesSizes
                    ? getVariationStockForStore(item, item.storeId)
                    : getVariationStockForStore(item, item.storeId, item.selectedColor, item.selectedSize)
                  const colors = item.usesSizes ? getVariationColors(item.variations ?? []) : []
                  const sizes = item.usesSizes && item.selectedColor ? getSizesForColor(item.variations ?? [], item.selectedColor) : []
                  return (
                    <div className='tickets-lines__row' key={index}>
                      <div className='tickets-lines__cell tickets-lines__cell--name'>
                        <span className='tickets-lines__code'>{item.code || 's/c'}</span>
                        <div className='tickets-lines__name'>
                          <strong>{item.name}</strong>
                          {stock != null && <small>Existencia actual: {stock}</small>}
                        </div>
                      </div>

                      <div className='tickets-lines__cell' data-label='Cantidad'>
                        <input
                          className='tickets-lines__input'
                          type='text'
                          inputMode='decimal'
                          value={item.quantity === null ? '' : item.quantity}
                          onChange={(e) => handleAmountChange(e, index)}
                          placeholder='0'
                          aria-label={`Cantidad de ${item.name}`}
                        />
                      </div>

                      {concepts.some((c: any) => c.usesSizes) && (
                        <div className='tickets-lines__cell tickets-lines__cell--variants' data-label='Color y talla'>
                          {item.usesSizes ? (
                            <>
                              <select className='tickets-lines__select' value={item.selectedColor ?? ''} onChange={(e) => handleColorChange(e, index)} aria-label='Color'>
                                <option value=''>Color</option>
                                {colors.map((c: any) => <option key={c.color} value={c.color}>{c.color}</option>)}
                              </select>
                              <select className='tickets-lines__select' value={item.selectedSize ?? ''} onChange={(e) => handleSizeChange(e, index)} disabled={!item.selectedColor} aria-label='Talla'>
                                <option value=''>Talla</option>
                                {sizes.map((v: any) => {
                                  const sizeStock = getVariationStockForStore(item, item.storeId, item.selectedColor, v.size)
                                  return <option key={v.id} value={v.size}>{sizeStock != null ? `${v.size} (${sizeStock})` : v.size}</option>
                                })}
                              </select>
                            </>
                          ) : (
                            <span className='tickets-lines__muted'>—</span>
                          )}
                        </div>
                      )}

                      <div className='tickets-lines__cell' data-label='Unidad'>
                        <select className='tickets-lines__select' value={item.unitId} onChange={(e) => handlUnitsChange(e, index)} aria-label='Unidad'>
                          {item.units?.map((unitRow: any) => (
                            <option key={unitRow.id} value={unitRow.unitId ?? unitRow.unit?.id}>{unitRow.unit?.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className='tickets-lines__cell' data-label='Almacén'>
                        <select className='tickets-lines__select' value={item.storeId} onChange={(e) => handlStoreChange(e, index)} aria-label='Almacén'>
                          {(branchStores.length ? branchStores : item.stores)?.map((store: any) => (
                            <option key={store.id} value={store.storeId ?? store.id}>{getStoreLabel(store)}</option>
                          ))}
                        </select>
                      </div>

                      <div className='tickets-lines__cell' data-label='Lote'>
                        <input
                          className='tickets-lines__input tickets-lines__input--left'
                          type='text'
                          maxLength={60}
                          value={item.lotCode ?? ''}
                          onChange={(e) => handleLotField(index, 'lotCode', e.target.value)}
                          placeholder='Opcional'
                          aria-label={`Lote de ${item.name}`}
                        />
                      </div>

                      <div className='tickets-lines__cell' data-label='Caduca'>
                        <DateField
                          className='tickets-lines__input tickets-lines__input--left'
                          value={item.expiryDate ?? ''}
                          onChange={(v) => handleLotField(index, 'expiryDate', v)}
                          aria-label={`Caducidad de ${item.name}`}
                          presets={EXPIRY_PRESETS}
                          expiryTone
                        />
                      </div>

                      <div className='tickets-lines__cell tickets-lines__col-actions'>
                        <button type='button' className='tickets-lines__icon-btn' onClick={() => deleteBranch(item, index)} title='Quitar de la entrada' aria-label='Quitar de la entrada'>
                          <span className='material-symbols-rounded'>delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className='tickets-lines__empty'>
                  <span className='material-symbols-rounded' aria-hidden>inventory_2</span>
                  <p>Todavía no hay artículos en la entrada</p>
                  <small>Búscalos arriba por código, código de barras o nombre.</small>
                </div>
              )}
            </div>
          </div>
          <div className='row__three'>
            <button
              type='button'
              className='btn__general-secondary'
              onClick={() => handleModalChange('')}
              disabled={loadingTicket || saveState !== 'idle'}
            >
              Cancelar
            </button>
            <button
              className={`btn__general-primary tickets-save-btn ${saveState === 'done' ? 'is-done' : ''}`}
              onClick={saveTicket}
              disabled={loadingTicket || saveState !== 'idle'}
            >
              {saveState === 'saving' && <span className='tickets-save-btn__icon tickets-save-btn__icon--spin material-symbols-rounded' aria-hidden>progress_activity</span>}
              {saveState === 'done' && <span className='tickets-save-btn__icon material-symbols-rounded' aria-hidden>check_circle</span>}
              {saveState === 'saving'
                ? isUpdate ? 'Guardando…' : 'Creando entrada…'
                : saveState === 'done'
                  ? isUpdate ? 'Cambios guardados' : 'Entrada creada'
                  : loadingTicket
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
