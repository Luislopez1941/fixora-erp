import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { showToast } from '../../../../utils/toast'
import { errorText } from './variantTypes'

/**
 * Recalcular los precios de los artículos que usan la plantilla: primero cuenta cuántos se actualizan (precio según la
 * plantilla) y cuántos no se tocan (precio manual), pide confirmación y lo hace en el servidor en lote.
 * `ask` = mensaje inicial (p. ej. "Cambiaste la fórmula"). Devuelve true si se recalculó.
 */
export async function offerRecalc(templateId: number, name: string, ask?: string): Promise<boolean> {
  try {
    const preview: any = await APIs.getVariantTemplateRecalcPreview(templateId)
    const { template = 0, manual = 0, calculates = false } = preview?.data ?? {}
    if (!calculates || !template) {
      if (!ask) {
        await Swal.fire({
          icon: 'info',
          title: 'Nada que recalcular',
          text: !calculates ? 'Esta plantilla no calcula precios.' : `Ningún artículo de "${name}" tiene el precio según la plantilla${manual ? ` (${manual} con precio manual)` : ''}.`,
          confirmButtonColor: '#072a57',
        })
      }
      return false
    }
    const ok = await Swal.fire({
      title: '¿Recalcular precios?',
      html: `${ask ? `${ask}<br/><br/>` : ''}Se actualizarán <b>${template.toLocaleString('es-MX')}</b> artículo(s) con precio según la plantilla.${
        manual ? `<br/><b>${manual.toLocaleString('es-MX')}</b> con precio manual no se tocan.` : ''
      }`,
      showCancelButton: true,
      confirmButtonText: 'Recalcular ahora',
      cancelButtonText: ask ? 'Después' : 'Cancelar',
      confirmButtonColor: '#072a57',
    })
    if (!ok.isConfirmed) return false
    const res: any = await APIs.recalcVariantTemplatePrices(templateId)
    const d = res?.data ?? {}
    const changed = (d.itemsChanged ?? 0) + (d.variationsChanged ?? 0)
    showToast({
      type: 'success',
      title: 'Precios recalculados',
      text: changed
        ? `${(d.itemsChanged ?? 0).toLocaleString('es-MX')} artículo(s) y ${(d.variationsChanged ?? 0).toLocaleString('es-MX')} variante(s) cambiaron.`
        : 'Los precios ya estaban al día.',
    })
    return true
  } catch (e) {
    showToast({ type: 'error', title: 'No se pudieron recalcular', text: errorText(e, 'Intenta de nuevo.') })
    return false
  }
}
