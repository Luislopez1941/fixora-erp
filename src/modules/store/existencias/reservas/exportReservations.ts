import APIs from '../../../../services/APIs'
import { dateShort, dateTime, downloadCsv, fetchAllRows, money, qty } from '../shared/stockFormat'
import { downloadStockPdf } from '../shared/stockPdf'

export interface ReservationsQuery {
  companyId: number | null
  branchId?: number
  search?: string
  status?: string
  from?: string
  to?: string
}

const load = (q: ReservationsQuery) => fetchAllRows((page) => APIs.getStockReservations({ ...q, page, pageSize: 100 }))
const stamp = () => new Date().toISOString().slice(0, 10)

export async function exportReservationsCsv(q: ReservationsQuery) {
  const { rows } = await load(q)
  downloadCsv(
    `reservas-${stamp()}.csv`,
    ['Pedido', 'Sucursal', 'Cliente', 'Creado', 'Entrega', 'Renglones', 'Piezas por entregar', 'Importe por entregar', 'Atrasado', 'Con faltante'],
    rows.map((r: any) => [
      `${r.serie}-${r.folio}`,
      r.branchName,
      r.customer,
      r.createdAt?.slice(0, 10) ?? '',
      r.deliveryDate ?? '',
      r.lines,
      r.pieces,
      r.amount,
      r.overdue ? 'Sí' : 'No',
      r.shortage ? 'Sí' : 'No',
    ]),
  )
}

export async function exportReservationsPdf(q: ReservationsQuery, scopeText: string) {
  const { rows, data } = await load(q)
  const s = data.summary ?? {}
  await downloadStockPdf({
    fileName: `reservas-${stamp()}.pdf`,
    title: 'Reservas por entregar',
    subtitle: scopeText,
    kpis: [
      { label: 'Pedidos', value: qty(s.orders) },
      { label: 'Piezas', value: qty(s.pieces) },
      { label: 'Importe', value: money(s.amount) },
      { label: 'Atrasados', value: qty(s.overdue) },
    ],
    columns: [
      { header: 'Pedido', width: 'auto' },
      { header: 'Cliente', width: '*' },
      { header: 'Creado', width: 'auto' },
      { header: 'Entrega', width: 'auto' },
      { header: 'Piezas', width: 'auto', align: 'right' },
      { header: 'Importe', width: 'auto', align: 'right' },
      { header: 'Alerta', width: 'auto' },
    ],
    rows: rows.map((r: any) => [
      `${r.serie}-${r.folio}`,
      `${r.customer} · ${r.branchName}`,
      dateTime(r.createdAt),
      r.deliveryDate ? dateShort(r.deliveryDate) : 'Sin fecha',
      qty(r.pieces),
      money(r.amount),
      [r.overdue ? 'Atrasado' : '', r.shortage ? 'Faltante' : ''].filter(Boolean).join(' · '),
    ]),
  })
}
