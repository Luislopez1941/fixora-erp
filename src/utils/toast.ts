import Swal from 'sweetalert2'
import '../styles/toast.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  type?: ToastType
  title: string
  /** Línea de detalle bajo el título */
  text?: string
  /** Datos destacados en una fila (p. ej. folio, total, forma de pago) */
  details?: { label: string; value: string; strong?: boolean }[]
  /** Milisegundos visible (por omisión 3500; los errores 6000) */
  timer?: number
}

const ICONS: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * Aviso breve con el diseño de la app (tarjeta con franja de color, ícono, detalle y barra de tiempo). Es el único punto
 * para los toasts: los estilos viven en styles/toast.css y siguen los colores del tema (--primary-color / --secondary-color).
 */
export function showToast({ type = 'success', title, text, details, timer }: ToastOptions) {
  const detailsHtml = details?.length
    ? `<div class="fx-toast__details">${details
        .map((d) => `<span class="fx-toast__detail${d.strong ? ' is-strong' : ''}"><small>${esc(d.label)}</small><b>${esc(d.value)}</b></span>`)
        .join('')}</div>`
    : ''
  return Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    closeButtonHtml: '<span class="material-symbols-rounded" aria-hidden="true">close</span>',
    timer: timer ?? (type === 'error' ? 6000 : 3500),
    timerProgressBar: true,
    icon: undefined,
    html: `<div class="fx-toast__body">
        <span class="fx-toast__icon material-symbols-rounded" aria-hidden="true">${ICONS[type]}</span>
        <div class="fx-toast__content">
          <strong class="fx-toast__title">${esc(title)}</strong>
          ${text ? `<span class="fx-toast__text">${esc(text)}</span>` : ''}
          ${detailsHtml}
        </div>
      </div>`,
    customClass: {
      container: 'fx-toast-container',
      popup: `fx-toast fx-toast--${type}`,
      htmlContainer: 'fx-toast__html',
      closeButton: 'fx-toast__close',
      timerProgressBar: 'fx-toast__progress',
    },
    showClass: { popup: 'fx-toast--in' },
    hideClass: { popup: 'fx-toast--out' },
    didOpen: (el) => {
      // Pausa el tiempo mientras el puntero está encima (para alcanzar a leer el folio)
      el.addEventListener('mouseenter', Swal.stopTimer)
      el.addEventListener('mouseleave', Swal.resumeTimer)
    },
  })
}
