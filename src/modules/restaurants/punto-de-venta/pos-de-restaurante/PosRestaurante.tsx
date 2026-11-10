import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import { showToast } from '../../../../utils/toast'
import CategoriesStorePicker from '../../../../components/sidebar/sections/catalogos/categories/CategoriesStorePicker'
import DishCatalog from './dish-catalog/DishCatalog'
import VariantPicker from '../../../../components/sidebar/sections/sales/sales-sheet/modal-sale-sheet/variant-picker/VariantPicker'
import PosModal from '../../shared/pos-modal/PosModal'
import { Floor, IVA_RATE, KitchenTicket, RestaurantTable, Tab, TabItem, TabSummary, TabType, errorText, liveItems, money, qty } from '../../shared/restaurantTypes'
import { printKitchenTicket, printPreBill, printSaleTicket, printSplitBill, printWindow } from '../../shared/ticketPdf'
import ModalCustomer, { customerName } from './modal-customer/ModalCustomer'
import ModalWaiter from './modal-waiter/ModalWaiter'
import ModalMore from './modal-more/ModalMore'
import FloorMap from './floor-map/FloorMap'
import TabPanel from './tab-panel/TabPanel'
import ModalOpenTab from './modal-open-tab/ModalOpenTab'
import ModalPickTab from './modal-pick-tab/ModalPickTab'
import ModalItem from './modal-item/ModalItem'
import ModalReason from './modal-reason/ModalReason'
import ModalSplit from './modal-split/ModalSplit'
import ModalMerge from './modal-merge/ModalMerge'
import ModalMove from './modal-move/ModalMove'
import ModalCharge from './modal-charge/ModalCharge'
import '../../../../components/general/skeleton/TableSkeleton.css'
import '../../../cash-register/shared/CashShared.css'
import '../../shared/restaurants.css'
import './PosRestaurante.css'

type ModalState =
  | { kind: 'open'; type: TabType; table?: RestaurantTable }
  | { kind: 'pick'; table: RestaurantTable }
  | { kind: 'editTab' }
  | { kind: 'item'; item: TabItem }
  | { kind: 'cancelItem'; item: TabItem }
  | { kind: 'cancelTab' }
  | { kind: 'split' }
  | { kind: 'merge' }
  | { kind: 'move' }
  | { kind: 'charge' }
  | { kind: 'customer' }
  | { kind: 'waiter' }
  | { kind: 'more' }
  | { kind: 'variant'; product: any }
  | { kind: 'paid'; tab: Tab; change: number; kitchenTicket: KitchenTicket | null }
  | null

const AUTO_PRINT_KEY = 'restaurant-pos-print-comanda'
const readAutoPrint = () => {
  try {
    return localStorage.getItem(AUTO_PRINT_KEY) !== '0'
  } catch {
    return true
  }
}

/**
 * POS de restaurante: plano de mesas → cuenta (catálogo + partidas) → enviar a cocina → cobrar.
 * El cobro usa el motor de Ventas y la Caja (turno abierto, pagos mixtos, existencias e insumos).
 */
const PosRestaurante: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.punto-de-venta-pos-de-restaurante.view')
  const [params, setParams] = useSearchParams()
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [floor, setFloor] = useState<Floor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab | null>(null)
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [autoPrint, setAutoPrint] = useState(readAutoPrint)
  const [showCatalog, setShowCatalog] = useState(true)
  // Nombre de los clientes asignados a cuentas (para el botón "Cliente")
  const [customerLabels, setCustomerLabels] = useState<Record<number, string>>({})
  const tabRef = useRef<Tab | null>(null)
  tabRef.current = tab

  const loadFloor = useCallback(
    async (quiet = false) => {
      if (!(branchId > 0) || !canView) {
        setLoading(false)
        return
      }
      if (!quiet) setLoading(true)
      try {
        const res: any = await APIs.getRestaurantFloor(branchId)
        setFloor(res?.data ?? null)
        setError('')
      } catch (e) {
        if (!quiet) setError(errorText(e, 'No se pudo cargar el plano.'))
      } finally {
        setLoading(false)
      }
    },
    [branchId, canView],
  )

  useEffect(() => {
    loadFloor()
  }, [loadFloor])

  // Otras cajas y meseros también abren y cobran: el plano se refresca solo mientras se ve
  useEffect(() => {
    if (tab) return
    const t = setInterval(() => loadFloor(true), 20_000)
    return () => clearInterval(t)
  }, [tab, loadFloor])

  const openTab = useCallback(
    async (id: number) => {
      setBusy(true)
      try {
        const res: any = await APIs.getRestaurantTab(id)
        const data: Tab = res?.data
        if (data.status === 'PAID' || data.status === 'CANCELLED') {
          showToast({ type: 'warning', title: `La cuenta #${data.folio} ya está ${data.status === 'PAID' ? 'cobrada' : 'cerrada'}` })
          return
        }
        setTab(data)
        setShowCatalog(true)
      } catch (e) {
        showToast({ type: 'error', title: 'No se pudo abrir la cuenta', text: errorText(e, 'Intenta de nuevo.') })
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  // Llegar con ?tab=ID (desde Cuentas abiertas) abre esa cuenta
  useEffect(() => {
    const id = Number(params.get('tab'))
    if (id > 0 && canView) {
      openTab(id)
      params.delete('tab')
      setParams(params, { replace: true })
    }
  }, [params, setParams, openTab, canView])

  const closeTab = () => {
    setTab(null)
    setModal(null)
    loadFloor(true)
  }

  /** Corre una acción sobre la cuenta y deja la respuesta como cuenta actual. */
  const run = async (fn: () => Promise<any>, ok?: string, pick: (data: any) => Tab | null = (d) => d) => {
    setBusy(true)
    try {
      const res: any = await fn()
      const next = pick(res?.data)
      if (next) setTab(next)
      if (ok) showToast({ type: 'success', title: ok })
      return res?.data
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo completar', text: errorText(e, 'Intenta de nuevo.') })
      return null
    } finally {
      setBusy(false)
    }
  }

  // ───────── Plano ─────────

  const onTable = (table: RestaurantTable) => {
    if (!table.tabs.length) return setModal({ kind: 'open', type: 'DINE_IN', table })
    if (table.tabs.length === 1) return openTab(table.tabs[0].id)
    setModal({ kind: 'pick', table })
  }

  const submitOpen = async (data: { label: string; guests: number }) => {
    if (modal?.kind !== 'open') return
    const created = await run(
      () => APIs.openRestaurantTab({ branchId, type: modal.type, tableId: modal.table?.id, label: data.label || undefined, guests: data.guests }),
      undefined,
    )
    if (created) {
      setModal(null)
      setShowCatalog(true)
    }
  }

  useEffect(() => {
    const id = tab?.customerId
    if (!id || customerLabels[id] || !floor) return
    APIs.getCustomers(floor.companyId)
      .then((res: any) => {
        const rows: any[] = Array.isArray(res) ? res : res?.data ?? []
        setCustomerLabels((m) => ({ ...m, ...Object.fromEntries(rows.map((c) => [c.id, customerName(c)])) }))
      })
      .catch(() => undefined)
  }, [tab?.customerId, customerLabels, floor])

  // ───────── Partidas ─────────

  const addItem = async (item: { id: number; name?: string }, variationId?: number) => {
    const current = tabRef.current
    if (!current) return
    // Mismo platillo, sin indicaciones y sin enviar: se suma a la partida en vez de crear otra línea
    const same = current.items.find(
      (i) => i.status === 'PENDING' && i.itemId === item.id && (i.itemVariationId ?? null) === (variationId ?? null) && !i.modifiers?.length && !i.notes && !i.seat,
    )
    if (same) {
      await run(() => APIs.updateRestaurantTabItem(current.id, same.id, { quantity: Number(same.quantity) + 1 }))
      return
    }
    await run(() => APIs.addRestaurantTabItems(current.id, [{ itemId: item.id, itemVariationId: variationId, quantity: 1 }]))
  }

  const onQty = (item: TabItem, delta: number) => {
    if (!tab) return
    const next = Number(item.quantity) + delta
    if (next <= 0) return run(() => APIs.removeRestaurantTabItem(tab.id, item.id))
    run(() => APIs.updateRestaurantTabItem(tab.id, item.id, { quantity: next }))
  }

  const onRemoveItem = (item: TabItem) => {
    if (!tab) return
    if (item.status === 'PENDING') return run(() => APIs.removeRestaurantTabItem(tab.id, item.id))
    setModal({ kind: 'cancelItem', item })
  }

  // ───────── Cocina y cuenta ─────────

  const onSend = async (course?: number) => {
    if (!tab) return
    const win = autoPrint ? printWindow() : null
    const data = await run(() => APIs.sendRestaurantTab(tab.id, course), undefined, (d) => d?.tab ?? null)
    if (!data) {
      win?.close()
      return
    }
    showToast({ type: 'success', title: `Comanda ${data.ticket.ticketNo} enviada`, text: `${data.ticket.items.length} platillo(s) a cocina${data.ticket.estimatedMinutes ? ` · listo en ~${data.ticket.estimatedMinutes} min` : ''}` })
    if (autoPrint) printKitchenTicket(data.tab, data.ticket, win).catch(() => win?.close())
  }

  /** Vuelve a pedir lo de una comanda ya enviada (otra ronda de lo mismo) */
  const onRepeat = async (ticketNo: number) => {
    if (!tab) return
    const items = liveItems(tab).filter((i) => i.kitchenTicketNo === ticketNo)
    if (!items.length) return
    setModal(null)
    await run(
      () =>
        APIs.addRestaurantTabItems(
          tab.id,
          items.map((i) => ({
            itemId: i.itemId,
            itemVariationId: i.itemVariationId ?? undefined,
            quantity: Number(i.quantity),
            modifiers: i.modifiers ?? undefined,
            notes: i.notes ?? undefined,
            seat: i.seat ?? undefined,
            course: i.course,
          })),
        ),
      'Ronda agregada: revisa y envíala a cocina',
    )
  }

  const onReprint = (ticketNo: number) => {
    if (!tab) return
    const items = liveItems(tab).filter((i) => i.kitchenTicketNo === ticketNo)
    const win = printWindow()
    printKitchenTicket(
      tab,
      {
        ticketNo,
        sentAt: items[0]?.sentAt ?? new Date().toISOString(),
        items: items.map((i) => ({ id: i.id, name: i.name, quantity: Number(i.quantity), modifiers: i.modifiers ?? [], notes: i.notes, seat: i.seat, course: i.course, station: null })),
      },
      win,
    ).catch(() => win?.close())
  }

  /** Cuenta por comensal o en partes iguales (informativa, con IVA aproximado) */
  const onPrintSplit = async (mode: 'seats' | 'equal', parts = 2) => {
    if (!tab) return
    const win = printWindow()
    try {
      const [ticket, preview]: any[] = await Promise.all([APIs.getRestaurantTabTicket(tab.id), APIs.previewRestaurantTab(tab.id)])
      const items = liveItems(tab)
      const line = (i: (typeof items)[number]) => ({ qty: qty(i.quantity), name: i.name, amount: Number(i.quantity) * Number(i.unitPrice) * (1 + IVA_RATE) })
      let sections: { label: string; lines: ReturnType<typeof line>[]; total: number }[]
      if (mode === 'seats') {
        const seats = [...new Set(items.map((i) => i.seat ?? 0))].sort((a, b) => a - b)
        sections = seats.map((s) => {
          const lines = items.filter((i) => (i.seat ?? 0) === s).map(line)
          return { label: s ? `Comensal ${s}` : 'Compartido', lines, total: lines.reduce((a, l) => a + l.amount, 0) }
        })
      } else {
        const total = Number(preview?.data?.total ?? items.reduce((a, i) => a + line(i).amount, 0))
        const each = Math.floor((total / parts) * 100) / 100
        sections = Array.from({ length: parts }, (_, k) => ({ label: `Parte ${k + 1} de ${parts}`, lines: [], total: k === parts - 1 ? Math.round((total - each * (parts - 1)) * 100) / 100 : each }))
      }
      await printSplitBill(ticket?.data, sections, win)
      setModal(null)
    } catch (e) {
      win?.close()
      showToast({ type: 'error', title: 'No se pudo imprimir', text: errorText(e, 'Intenta de nuevo.') })
    }
  }

  const onPreBill = async () => {
    if (!tab) return
    const win = printWindow()
    setBusy(true)
    try {
      const [ticket, preview]: any[] = await Promise.all([APIs.getRestaurantTabTicket(tab.id), APIs.previewRestaurantTab(tab.id)])
      await printPreBill(ticket?.data, preview?.data, win)
      if (tab.status === 'OPEN') {
        const res: any = await APIs.requestRestaurantBill(tab.id)
        if (res?.data) setTab(res.data)
      }
    } catch (e) {
      win?.close()
      showToast({ type: 'error', title: 'No se pudo imprimir la pre-cuenta', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setBusy(false)
    }
  }

  const onCharge = async (data: Parameters<React.ComponentProps<typeof ModalCharge>['onCharge']>[0]) => {
    if (!tab) return
    setBusy(true)
    try {
      const res: any = await APIs.chargeRestaurantTab(tab.id, data)
      const r = res?.data
      setModal({ kind: 'paid', tab: r.tab, change: Number(r.change) || 0, kitchenTicket: r.kitchenTicket ?? null })
      setTab(null)
      loadFloor(true)
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo cobrar', text: errorText(e, 'Revisa los pagos e intenta de nuevo.') })
    } finally {
      setBusy(false)
    }
  }

  const printPaid = async (paid: Tab, change: number) => {
    const win = printWindow()
    try {
      const res: any = await APIs.getRestaurantTabTicket(paid.id)
      await printSaleTicket(res?.data, change, win)
    } catch (e) {
      win?.close()
      showToast({ type: 'error', title: 'No se pudo imprimir el ticket', text: errorText(e, 'Puedes reimprimirlo desde Reimpresión de tickets.') })
    }
  }

  const toggleAutoPrint = () => {
    setAutoPrint((v) => {
      try {
        localStorage.setItem(AUTO_PRINT_KEY, v ? '0' : '1')
      } catch {
        /* sin almacenamiento: solo dura esta sesión */
      }
      return !v
    })
  }

  // ───────── Render ─────────

  if (!canView) {
    return (
      <div className='cash-ui'>
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>lock</span>
          <p>No tienes permiso para usar el POS de restaurante.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rpos ${tab ? 'has-tab' : ''}`}>
      <div className='rpos__header'>
        <div className='cash-ui__title'>
          <h1>POS de restaurante</h1>
          <p>{tab ? 'Agrega platillos, envía a cocina y cobra.' : 'Toca una mesa para abrir o continuar su cuenta.'}</p>
        </div>
        <div className='rpos__header-tools'>
          <label className='rpos__switch' title='Al enviar a cocina se abre la comanda para imprimir'>
            <input type='checkbox' checked={autoPrint} onChange={toggleAutoPrint} /> Imprimir comanda
          </label>
          {!tab ? (
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={(id) => {
                setBranchId(id)
                localStorage.setItem('categories-store-id', String(id))
                localStorage.setItem('categories-picker-branch-id', String(id))
              }}
            />
          ) : null}
        </div>
      </div>

      {error ? (
        <div className='cash-ui__error' role='alert'>
          <span className='material-symbols-rounded' aria-hidden>error</span>
          <span>{error}</span>
          <button type='button' onClick={() => loadFloor()} aria-label='Reintentar'>
            <span className='material-symbols-rounded'>refresh</span>
          </button>
        </div>
      ) : null}

      {!(branchId > 0) ? (
        <div className='cash-ui__state'>
          <span className='material-symbols-rounded' aria-hidden>store</span>
          <p>Elige una sucursal.</p>
        </div>
      ) : loading && !floor ? (
        <div className='rpos__skeleton'>
          <span className='table-skeleton__shimmer' />
          <span className='table-skeleton__shimmer' />
        </div>
      ) : tab && floor ? (
        <div className={`rpos__work ${showCatalog ? 'show-catalog' : 'show-tab'}`}>
          <div className='rpos__switcher' role='tablist'>
            <button type='button' role='tab' aria-selected={showCatalog} className={showCatalog ? 'is-active' : ''} onClick={() => setShowCatalog(true)}>
              Platillos
            </button>
            <button type='button' role='tab' aria-selected={!showCatalog} className={!showCatalog ? 'is-active' : ''} onClick={() => setShowCatalog(false)}>
              Cuenta · {money(tab.subtotal)}
            </button>
          </div>
          <div className='rpos__catalog'>
            <DishCatalog branchId={branchId} onAdd={(dish) => addItem(dish)} />
          </div>
          <div className='rpos__tab'>
            <TabPanel
              tab={tab}
              busy={busy}
              onBack={closeTab}
              onQty={onQty}
              onEditItem={(item) => setModal({ kind: 'item', item })}
              onRemoveItem={onRemoveItem}
              onSend={() => onSend()}
              onPreBill={onPreBill}
              onCharge={() => setModal({ kind: 'charge' })}
              onSplit={() => setModal({ kind: 'split' })}
              onMerge={() => setModal({ kind: 'merge' })}
              onCustomer={() => setModal({ kind: 'customer' })}
              onMore={() => setModal({ kind: 'more' })}
              customerLabel={tab.customerId ? customerLabels[tab.customerId] ?? 'Cliente' : null}
              onMove={() => setModal({ kind: 'move' })}
              onEditTab={() => setModal({ kind: 'editTab' })}
              onCancelTab={() => setModal({ kind: 'cancelTab' })}
            />
          </div>
        </div>
      ) : floor ? (
        <FloorMap
          floor={floor}
          onTable={onTable}
          onTab={(t: TabSummary) => openTab(t.id)}
          onNew={(type) => setModal({ kind: 'open', type })}
        />
      ) : null}

      {modal?.kind === 'open' ? (
        <ModalOpenTab mode='open' type={modal.type} tableName={modal.table?.name} busy={busy} onClose={() => setModal(null)} onSubmit={submitOpen} />
      ) : null}
      {modal?.kind === 'pick' ? (
        <ModalPickTab
          table={modal.table}
          onClose={() => setModal(null)}
          onPick={(t) => {
            setModal(null)
            openTab(t.id)
          }}
          onNew={() => setModal({ kind: 'open', type: 'DINE_IN', table: modal.table })}
        />
      ) : null}
      {modal?.kind === 'editTab' && tab ? (
        <ModalOpenTab
          mode='edit'
          type={tab.type}
          initial={{ label: tab.label, guests: tab.guests }}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={async (d) => {
            if (await run(() => APIs.updateRestaurantTab(tab.id, { label: d.label, guests: d.guests }))) setModal(null)
          }}
        />
      ) : null}
      {modal?.kind === 'item' && tab ? (
        <ModalItem
          item={modal.item}
          guests={tab.guests}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={async (d) => {
            if (await run(() => APIs.updateRestaurantTabItem(tab.id, modal.item.id, d))) setModal(null)
          }}
        />
      ) : null}
      {modal?.kind === 'cancelItem' && tab ? (
        <ModalReason
          title={`Cancelar ${modal.item.name}`}
          text='Ya se envió a cocina. Solo un gerente o supervisor puede cancelarlo, y queda registrado con el motivo.'
          confirmLabel='Cancelar platillo'
          busy={busy}
          onClose={() => setModal(null)}
          onConfirm={async (reason) => {
            if (await run(() => APIs.cancelRestaurantTabItem(tab.id, modal.item.id, reason), 'Platillo cancelado')) setModal(null)
          }}
        />
      ) : null}
      {modal?.kind === 'cancelTab' && tab ? (
        <ModalReason
          title={`Cancelar la cuenta #${tab.folio}`}
          text='La cuenta se cierra sin cobrar. Si ya hay platillos enviados a cocina, solo un gerente o supervisor puede hacerlo.'
          confirmLabel='Cancelar cuenta'
          busy={busy}
          onClose={() => setModal(null)}
          onConfirm={async (reason) => {
            const done = await run(() => APIs.cancelRestaurantTab(tab.id, reason), 'Cuenta cancelada', () => null)
            if (done) closeTab()
          }}
        />
      ) : null}
      {modal?.kind === 'split' && tab ? (
        <ModalSplit
          tab={tab}
          busy={busy}
          onClose={() => setModal(null)}
          onSplit={async (parts, label) => {
            const data = await run(() => APIs.splitRestaurantTab(tab.id, parts, label || undefined), undefined, (d) => d?.original ?? null)
            if (data) {
              setModal(null)
              showToast({ type: 'success', title: `Cuenta dividida`, text: `Se creó la cuenta #${data.created.folio} en la misma mesa.` })
              loadFloor(true)
            }
          }}
        />
      ) : null}
      {modal?.kind === 'merge' && tab && floor ? (
        <ModalMerge
          floor={floor}
          tab={tab}
          busy={busy}
          onClose={() => setModal(null)}
          onMerge={async (ids) => {
            if (await run(() => APIs.mergeRestaurantTabs(tab.id, ids), 'Cuentas unidas')) {
              setModal(null)
              loadFloor(true)
            }
          }}
        />
      ) : null}
      {modal?.kind === 'move' && tab && floor ? (
        <ModalMove
          floor={floor}
          currentTableId={tab.tableId}
          busy={busy}
          onClose={() => setModal(null)}
          onPick={async (tableId) => {
            if (await run(() => APIs.moveRestaurantTab(tab.id, tableId), 'Cuenta movida')) {
              setModal(null)
              loadFloor(true)
            }
          }}
        />
      ) : null}
      {modal?.kind === 'charge' && tab && floor ? (
        <ModalCharge tab={tab} companyId={floor.companyId} branchId={branchId} busy={busy} onClose={() => setModal(null)} onCharge={onCharge} />
      ) : null}
      {modal?.kind === 'customer' && tab && floor ? (
        <ModalCustomer
          companyId={floor.companyId}
          currentId={tab.customerId}
          busy={busy}
          onClose={() => setModal(null)}
          onPick={async (customerId, label) => {
            if (customerId && label) setCustomerLabels((m) => ({ ...m, [customerId]: label }))
            const t = await run(() => APIs.updateRestaurantTab(tab.id, { customerId }), customerId ? 'Cliente asignado' : 'Cliente quitado')
            if (t) setModal(null)
          }}
        />
      ) : null}
      {modal?.kind === 'waiter' && tab && floor ? (
        <ModalWaiter
          companyId={floor.companyId}
          branchId={branchId}
          current={tab.waiterName}
          busy={busy}
          onClose={() => setModal(null)}
          onPick={async (waiterUserId) => {
            if (await run(() => APIs.updateRestaurantTab(tab.id, { waiterUserId }), 'Mesero cambiado')) setModal(null)
          }}
        />
      ) : null}
      {modal?.kind === 'more' && tab ? (
        <ModalMore
          tab={tab}
          busy={busy}
          onClose={() => setModal(null)}
          onFire={(course) => {
            setModal(null)
            onSend(course)
          }}
          onRepeat={onRepeat}
          onReprint={onReprint}
          onPrintBill={(mode, parts) => (mode === 'full' ? (setModal(null), onPreBill()) : onPrintSplit(mode, parts))}
          onWaiter={() => setModal({ kind: 'waiter' })}
        />
      ) : null}
      {modal?.kind === 'variant' ? (
        <VariantPicker
          product={modal.product}
          onClose={() => setModal(null)}
          onPick={(v) => {
            setModal(null)
            addItem({ id: modal.product.id, name: modal.product.name }, v.id)
          }}
        />
      ) : null}
      {modal?.kind === 'paid' ? (
        <PosModal
          title={`Cuenta #${modal.tab.folio} cobrada`}
          onClose={() => setModal(null)}
          actions={
            <>
              {modal.kitchenTicket ? (
                <button type='button' className='btn__general-secondary' onClick={() => printKitchenTicket(modal.tab, modal.kitchenTicket!, printWindow())}>
                  <span className='material-symbols-rounded'>skillet</span> Comanda
                </button>
              ) : null}
              <button type='button' className='btn__general-secondary' onClick={() => printPaid(modal.tab, modal.change)}>
                <span className='material-symbols-rounded'>print</span> Ticket
              </button>
              <button type='button' className='btn__general-purple' onClick={() => setModal(null)} autoFocus>
                Listo
              </button>
            </>
          }
        >
          <div className='rpos__paid'>
            <span className='material-symbols-rounded' aria-hidden>check_circle</span>
            <p>
              Venta {modal.tab.sale?.folio ?? ''} · {money(modal.tab.sale?.total)}
              {Number(modal.tab.tipAmount) > 0 ? ` · propina ${money(modal.tab.tipAmount)}` : ''}
            </p>
            {modal.change > 0 ? (
              <div className='rpos__change'>
                <small>Cambio</small>
                <strong>{money(modal.change)}</strong>
              </div>
            ) : null}
            {modal.kitchenTicket ? <p className='pos-note'>Lo que faltaba se envió a cocina (comanda {modal.kitchenTicket.ticketNo}).</p> : null}
          </div>
        </PosModal>
      ) : null}
    </div>
  )
}

export default PosRestaurante
