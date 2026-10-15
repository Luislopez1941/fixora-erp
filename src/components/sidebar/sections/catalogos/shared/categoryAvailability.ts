import Swal from 'sweetalert2'
import APIs from '../../../../../services/APIs'

/** Sucursales donde la categoría está efectivamente disponible (null = todas). */
export async function loadCategoryAvailability(categoryId: number | string): Promise<number[] | null> {
  try {
    const res: any = await APIs.getCategoryAvailability(categoryId)
    const rows: { branchId: number; effective: boolean }[] = Array.isArray(res?.data) ? res.data : []
    const on = rows.filter((r) => r.effective).map((r) => r.branchId)
    return on.length === rows.length ? null : on
  } catch {
    return null
  }
}

/** Lleva la disponibilidad real de la categoría a la elegida (null = todas) cambiando solo las diferencias. */
export async function applyCategoryAvailability(categoryId: number | string, desired: number[] | null): Promise<void> {
  const res: any = await APIs.getCategoryAvailability(categoryId)
  const rows: { branchId: number; effective: boolean }[] = Array.isArray(res?.data) ? res.data : []
  for (const row of rows) {
    const wanted = desired === null || desired.includes(row.branchId)
    if (wanted !== row.effective) {
      await APIs.setCategoryAvailability(categoryId, { branchId: row.branchId, enabled: wanted })
    }
  }
}

type ImpactRow = { branchName: string; count: number; sample: string[] }

/** Texto con los artículos afectados por sucursal y pregunta de confirmación. true = continuar. */
export async function confirmImpact(rows: ImpactRow[], what: string): Promise<boolean> {
  const affected = rows.filter((r) => r.count > 0)
  if (affected.length === 0) return true
  const html = affected
    .map(
      (r) =>
        `<p style="margin:8px 0;text-align:left"><strong>${r.branchName}:</strong> ${r.count} artículo${r.count === 1 ? '' : 's'}` +
        (r.sample.length ? `<br><span style="font-size:0.85em;opacity:0.8">${r.sample.join(', ')}${r.count > r.sample.length ? '…' : ''}</span>` : '') +
        '</p>',
    )
    .join('')
  const res = await Swal.fire({
    icon: 'warning',
    title: 'Hay artículos afectados',
    html: `<p style="text-align:left">${what}</p>${html}<p style="text-align:left;font-size:0.9em">Seguirán existiendo, pero dejarán de ofrecerse en esas sucursales.</p>`,
    showCancelButton: true,
    confirmButtonText: 'Continuar',
    cancelButtonText: 'Cancelar',
  })
  return res.isConfirmed
}

/**
 * Antes de quitar sucursales a una categoría: calcula qué artículos se afectan y pide confirmar.
 * true = se puede guardar.
 */
export async function confirmCategoryImpact(categoryId: number | string, desired: number[] | null): Promise<boolean> {
  try {
    const res: any = await APIs.getCategoryAvailability(categoryId)
    const rows: { branchId: number; branchName: string; effective: boolean }[] = Array.isArray(res?.data) ? res.data : []
    const removed = rows.filter((r) => r.effective && !(desired === null || desired.includes(r.branchId)))
    const impacts: ImpactRow[] = []
    for (const r of removed) {
      const imp: any = await APIs.getCategoryAvailabilityImpact(categoryId, r.branchId)
      impacts.push({ branchName: r.branchName, count: Number(imp?.count ?? 0), sample: (imp?.sample ?? []).map((i: any) => i.name) })
    }
    return confirmImpact(impacts, 'Al deshabilitar esta categoría (y sus subcategorías) en esas sucursales:')
  } catch {
    return true
  }
}
