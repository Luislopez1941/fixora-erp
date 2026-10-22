import APIs from '../../../../../../services/APIs'
import { TemplateCategory, VariantTemplate } from '../../../../../../modules/catalogos/productos-y-servicios/variantes/variantTypes'

export interface TemplatesData {
  templates: VariantTemplate[]
  categories: TemplateCategory[]
}

// Plantillas por empresa: se piden una vez mientras la pantalla está abierta (el modal se abre muchas veces)
const cache = new Map<string, Promise<TemplatesData>>()

export const loadTemplates = (companyId: number | null) => {
  const key = String(companyId ?? '')
  if (!cache.has(key)) {
    const p = APIs.getVariantTemplates(companyId).then((res: any) => ({ templates: res?.data?.templates ?? [], categories: res?.data?.categories ?? [] }))
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return cache.get(key)!
}
