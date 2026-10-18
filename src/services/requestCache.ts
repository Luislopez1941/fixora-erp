/**
 * Caché corto en memoria para peticiones GET que varios componentes piden al mismo tiempo (sidebar, menú, header,
 * selector de empresa/sucursal…). Dos cosas:
 *  - Si ya hay una petición igual en vuelo, se reutiliza la misma promesa (sin esto, React StrictMode en desarrollo
 *    y cada componente que usa el mismo hook disparaban la petición otra vez).
 *  - La respuesta se guarda `ttlMs` milisegundos; si falla, no se guarda.
 */
const entries = new Map<string, { promise: Promise<unknown>; expiresAt: number }>()

export function cachedRequest<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = entries.get(key)
  if (hit && hit.expiresAt > now) return hit.promise as Promise<T>
  const promise = fn().catch((error) => {
    entries.delete(key)
    throw error
  })
  // Mientras está en vuelo vale "para siempre"; al resolver, cuenta el TTL desde ese momento
  entries.set(key, { promise, expiresAt: Number.POSITIVE_INFINITY })
  promise.then(
    () => {
      const current = entries.get(key)
      if (current?.promise === promise) current.expiresAt = Date.now() + ttlMs
    },
    () => undefined,
  )
  return promise
}

/** Borra del caché las claves que empiezan con `prefix` (p. ej. al activar un módulo o crear una sucursal). */
export function invalidateRequests(prefix = '') {
  for (const key of entries.keys()) if (key.startsWith(prefix)) entries.delete(key)
}
