export const getProductionRoutes = (order: any) =>
  [...(order?.item?.productionRoutes ?? [])].sort(
    (a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0),
  )

export const getCurrentRouteStep = (order: any) => order?.currentRouteStep ?? 0

export const getCurrentAreaName = (order: any) => {
  const routes = getProductionRoutes(order)
  const step = getCurrentRouteStep(order)
  return routes[step]?.area?.name ?? order?.area?.name ?? null
}

export const getNextRouteStep = (order: any) => getCurrentRouteStep(order) + 1

export const hasNextProductionArea = (order: any) => {
  const routes = getProductionRoutes(order)
  return getNextRouteStep(order) < routes.length
}

export const getNextAreaName = (order: any) => {
  const routes = getProductionRoutes(order)
  const nextStep = getNextRouteStep(order)
  if (nextStep >= routes.length) return null
  return routes[nextStep]?.area?.name ?? null
}

export const getRouteProgressLabel = (order: any) => {
  const routes = getProductionRoutes(order)
  if (!routes.length) return 'Sin ruta'
  const step = getCurrentRouteStep(order)
  const currentName = routes[step]?.area?.name
  const nextName = routes[step + 1]?.area?.name
  const base = `Paso ${step + 1}/${routes.length}`
  if (currentName && nextName) return `${base} · ${currentName} → ${nextName}`
  if (currentName) return `${base} · ${currentName}`
  return base
}

export const getAdvanceButtonLabel = (order: any) => {
  const nextArea = getNextAreaName(order)
  if (nextArea) return `Completar paso → ${nextArea}`
  if (getProductionRoutes(order).length > 0) return 'Finalizar producción'
  return 'Completar'
}
