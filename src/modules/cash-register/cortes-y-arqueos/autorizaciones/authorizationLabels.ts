/** Textos de la bandeja de autorizaciones. */
export const TYPE_LABEL: Record<string, string> = {
  CLOSE: 'Cierre de turno',
  COUNT: 'Arqueo',
  COUNT_CANCEL: 'Cancelación de arqueo',
  RETURN: 'Devolución especial',
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  AUTHORIZED: 'Autorizada',
  REJECTED: 'Rechazada',
}

/** Clase de color de la insignia por estado (usa las de ../shared/CashShared.css). */
export const STATUS_BADGE: Record<string, string> = {
  PENDING: 'cash-ui__badge--short',
  AUTHORIZED: 'cash-ui__badge--balanced',
  REJECTED: 'cash-ui__badge--cancelled',
}

/** Solo cierres y arqueos se resuelven aquí; lo demás ya pasó por un supervisor y es informativo. */
export const isResolvable = (type: string) => type === 'CLOSE' || type === 'COUNT'
