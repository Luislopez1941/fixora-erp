import React, { useCallback, useEffect, useState } from 'react'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import { showToast } from '../../../../utils/toast'
import RestaurantPage from '../../shared/restaurant-page/RestaurantPage'
import { Tab, TYPE_ICON, dateTime, errorText, money, tabTitle } from '../../shared/restaurantTypes'
import { printSaleTicket, printWindow } from '../../shared/ticketPdf'

const today = () => new Date().toISOString().slice(0, 10)
const PAGE_SIZE = 50

/** Cuentas cobradas (y canceladas) de un día, con su ticket para reimprimir. */
const ReimpresionTickets: React.FC = () => {
  const can = useCan()
  const canView = can('restaurants.punto-de-venta-reimpresion-de-tickets.view')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [day, setDay] = useState(today)
  const [rows, setRows] = useState<Tab[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [printing, setPrinting] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const from = new Date(`${day}T00:00:00`).toISOString()
      const to = new Date(`${day}T23:59:59.999`).toISOString()
      const res: any = await APIs.getRestaurantTabs({ branchId, status: 'closed', from, to, page, pageSize: PAGE_SIZE })
      setRows(res?.data ?? [])
      setTotal(res?.total ?? 0)
      setError('')
    } catch (e) {
      setError(errorText(e, 'No se pudieron cargar los tickets.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView, day, page])

  useEffect(() => {
    load()
  }, [load])

  const reprint = async (t: Tab) => {
    const win = printWindow()
    setPrinting(t.id)
    try {
      const res: any = await APIs.getRestaurantTabTicket(t.id)
      await printSaleTicket(res?.data, 0, win)
    } catch (e) {
      win?.close()
      showToast({ type: 'error', title: 'No se pudo imprimir', text: errorText(e, 'Intenta de nuevo.') })
    } finally {
      setPrinting(null)
    }
  }

  const paid = rows.filter((r) => r.status === 'PAID')
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <RestaurantPage
      title='Reimpresión de tickets'
      subtitle='Cuentas cerradas del día: reimprime el ticket de cualquiera que se haya cobrado.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading}
      error={error}
      onRetry={load}
      toolbar={
        <>
          <label className='pos-field'>
            Día
            <input id='restaurant-reprint-day' type='date' value={day} max={today()} onChange={(e) => { setDay(e.target.value || today()); setPage(1) }} />
          </label>
          <span className='pos-note'>
            {paid.length} cobrada(s) en esta página · {money(paid.reduce((acc, t) => acc + Number(t.sale?.total ?? 0), 0))}
          </span>
        </>
      }
    >
      {!rows.length ? (
        <p className='restaurant-empty'>No hay cuentas cerradas ese día.</p>
      ) : (
        <>
          <div className='restaurant-list'>
            {rows.map((t) => (
              <div key={t.id} className='restaurant-list__row'>
                <span className='material-symbols-rounded' aria-hidden>{TYPE_ICON[t.type]}</span>
                <span className='restaurant-list__main'>
                  <strong>
                    {tabTitle(t)}
                    {t.status === 'CANCELLED' ? <span className='restaurant-badge is-gray'>{t.cancelReason?.startsWith('Unida') ? 'Unida' : 'Cancelada'}</span> : null}
                  </strong>
                  <small>
                    #{t.folio}{t.sale?.folio ? ` · venta ${t.sale.folio}` : ''} · {dateTime(t.closedAt)} · {t.waiterName ?? 'Sin mesero'}
                    {t.status === 'CANCELLED' && t.cancelReason ? ` · ${t.cancelReason}` : ''}
                    {Number(t.tipAmount) > 0 ? ` · propina ${money(t.tipAmount)}` : ''}
                  </small>
                </span>
                <span className='restaurant-list__num'>{t.sale ? money(t.sale.total) : '—'}</span>
                {t.status === 'PAID' ? (
                  <button type='button' className='btn__general-secondary' onClick={() => reprint(t)} disabled={printing === t.id}>
                    <span className='material-symbols-rounded'>print</span> {printing === t.id ? 'Abriendo…' : 'Ticket'}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
          {pages > 1 ? (
            <div className='restaurant-page__toolbar'>
              <button type='button' className='btn__general-secondary' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
              <span className='pos-note'>Página {page} de {pages}</span>
              <button type='button' className='btn__general-secondary' disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
            </div>
          ) : null}
        </>
      )}
    </RestaurantPage>
  )
}

export default ReimpresionTickets
