import APIs from '../../../../../services/APIs'
import { updateArticles } from '../../../../../redux/state/Articles'

// Solo cuenta la respuesta de la ÚLTIMA petición: si se abre otro artículo (o se reintenta) antes de que termine, la vieja se ignora
let lastRequest = 0

/**
 * Carga el detalle de un artículo para el modal de edición. El modal ya está abierto: mientras carga, el artículo lleva
 * `__loading`; si falla, `__loadError` con el mensaje (el modal ofrece reintentar).
 */
export async function loadArticleDetail(item: any, dispatch: (action: any) => void) {
  const requestId = ++lastRequest
  const token = localStorage.getItem('token-fixora') ?? ''
  dispatch(updateArticles({ ...item, __loading: true, __loadError: undefined }))
  try {
    const full: any = await APIs.getItemById(item.id, token)
    if (requestId !== lastRequest) return
    dispatch(updateArticles(full?.data ?? full ?? item))
  } catch (error: any) {
    if (requestId !== lastRequest) return
    const message = error?.response?.data?.message ?? error?.message ?? 'No se pudo cargar el artículo.'
    dispatch(updateArticles({ ...item, __loading: false, __loadError: Array.isArray(message) ? message.join(', ') : String(message) }))
  }
}

/** Ignora la petición en curso (al cerrar el modal). */
export function cancelArticleDetail() {
  lastRequest++
}
