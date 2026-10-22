# Propuesta: plantillas de atributos y variaciones (estilo Mercado Libre)

> Solo análisis y propuesta. No se cambió código ni esquema. Benchmarks hechos en un Postgres local de pruebas (PGlite), nunca en la base real.

## 1. Diagnóstico: cómo está hoy

**Modelo.** `ItemVariation` tiene columnas fijas: `color`, `colorHex`, `size`, `sku`, `barcode`, `price` (opcional), `images` y `active`.
- Solo existen dos "ejes" posibles, color y talla. Para un refresco (sabor y presentación), un cable (longitud y calibre) o un taladro (voltaje) no hay dónde capturar el dato correcto.
- Los artículos sin variaciones no tienen filas en `ItemVariation`.
- Su existencia vive en `InventoryBalance` con `itemVariationId = 0`.

**Quién usa la variación.** 10 tablas la referencian, siempre por su `id` (`itemVariationId`), nunca por color o talla:
- `InventoryBalance`, `StockLedger` (kardex), `StockLot` y `StockLotConsumption`
- `StockEntryConcept`, `StockExit`, `StockTransferLine`
- `SaleLine`, `PriceRange`, `ProductionOrder`

➡️ **Cambiar cómo se guardan los atributos no toca ventas, kardex, saldos, lotes ni traspasos.** Esa es la mejor noticia de este análisis: el riesgo queda acotado a la captura y a cómo se muestran los atributos.

**Captura.** En el modal de artículo, `VariationsModal` arma una lista de color × talla. En el back, `item.service.ts` la guarda con `buildVariationRows` y `syncVariations`, que borran y vuelven a crear las variaciones.

**Por qué sale "Tallas" en todas las tablas.**
- La columna está fija en el front: Inventario actual, Artículos y la ficha de cobro.
- La consulta de la lista (`getInventoryPage`) une `ItemVariation` para contar variaciones agotadas o bajas, aunque el artículo no tenga ninguna.
- Si no hay variaciones, la tabla pinta "—".
- Hay unos 16 archivos del front que leen `.size` o `.color` directamente.

## 2. Cómo lo hace Mercado Libre

1. **Cada categoría tiene una plantilla de atributos** (la "ficha técnica"): marca, modelo, material, capacidad…
2. **Algunos atributos son "de variación"** (`allow_variations`), por ejemplo color, talla o sabor. Solo esos generan combinaciones.
3. **Una publicación sin atributos de variación es simple:** tiene una existencia y un precio, y no se ve nada de variaciones.
4. **Con variaciones,** cada combinación tiene su SKU, existencia, precio e imágenes.
5. **Los listados no cargan atributos;** muestran un resumen ("3 colores disponibles").

## 3. Propuesta para Fixora

### 3.1 Modelo de datos (pseudo-Prisma)

```prisma
// Plantilla por empresa. Opcionalmente sugerida por categoría (como ML).
model AttributeTemplate {
  id         Int      @id @default(autoincrement())
  companyId  Int
  name       String               // "Ropa", "Calzado", "Bebidas", "Electrónica"
  active     Boolean  @default(true)
  attributes TemplateAttribute[]
  @@unique([companyId, name])
}

model TemplateAttribute {
  id          Int     @id @default(autoincrement())
  templateId  Int
  name        String              // "Talla", "Color", "Sabor", "Capacidad", "Marca"
  type        String              // LIST | COLOR | TEXT | NUMBER | BOOLEAN
  unit        String?             // "ml", "V", "cm" (para NUMBER)
  options     String[]            // valores permitidos (LIST/COLOR); vacío = libre
  required    Boolean @default(false)
  isVariation Boolean @default(false) // ← los que generan combinaciones (máx. 3)
  axis        Int?                // 1, 2 o 3 si isVariation (mapea a option1..3)
  position    Int     @default(0)
}

model Category {
  // … campos actuales
  templateId  Int?                // plantilla sugerida para sus artículos
}

model Item {
  // … campos actuales
  templateId        Int?          // null = artículo simple, sin ficha técnica
  attributes        Json  @default("{}")  // ficha técnica (no variación): {"Marca":"Hojiblanca","Contenido":"500 ml"}
  // Resumen precalculado al guardar (lo usan TODAS las listas; nunca se calcula al vuelo)
  variationCount    Int   @default(0)
  variationSummary  String?       // "Talla: S, M, L · Color: Rojo, Azul"
}

model ItemVariation {
  // … id, itemId, sku, barcode, price, images, active (igual que hoy)
  option1   String?               // valor del eje 1 (p. ej. Talla = "M")
  option2   String?               // eje 2 (Color = "Rojo")
  option3   String?               // eje 3 (opcional)
  colorHex  String?               // solo si algún eje es tipo COLOR
  label     String                // "Rojo / M" precalculado → POS, tickets, kardex, reportes
  extra     Json   @default("{}") // atributos propios de la variación que no son eje (raro)
  @@unique([itemId, option1, option2, option3])
  @@index([barcode]) @@index([sku])
}
```

Por qué así, y no de otra forma:
- **Ejes como columnas genéricas `option1..3`:** es el esquema de Shopify. Es rápido, se puede indexar y no tiene joins.
- **Ficha técnica en JSONB:** es flexible y no estorba en las listas.
- **No EAV para los valores:** EAV significa una fila por cada atributo de cada variación. Es la opción más lenta y más pesada en todas las mediciones de la sección 4.

### 3.2 Comportamiento en pantallas

**Tablas** (Inventario actual, Artículos, Existencias):
- La columna fija "Tallas" desaparece.
- En su lugar va una columna **"Variaciones"** con un chip que sale de `variationSummary`, por ejemplo "10 variaciones · Talla: S–XL".
- Si el artículo es simple, la celda va vacía.
- Si ningún artículo de la página tiene variaciones, la columna se oculta.

**Ficha del artículo (ojo):** muestra los ejes con el nombre real que define la plantilla (Sabor, Capacidad…) y la ficha técnica.

**POS y tickets:**
- Muestran `label` ("Rojo / M").
- La búsqueda por código de barras o SKU de la variación sigue igual: ya tiene índice.

### 3.3 Flujo del usuario

1. **Catálogos › Plantillas:** se crea una plantilla, por ejemplo "Ropa", con los atributos Talla [XS…XL] (de variación, eje 1), Color [lista con hex] (de variación, eje 2) y Material (texto, ficha técnica).
2. **(Opcional)** Se asigna la plantilla a la categoría "Playeras" para que la sugiera.
3. **En el modal de artículo** se elige la plantilla. Si la categoría ya tiene una, viene preseleccionada.
   - Se llena la ficha técnica.
   - Se marcan los valores de cada eje y se genera la **matriz de combinaciones** (Talla × Color), con SKU, código, precio y existencia inicial por fila.
   - Se puede apagar una combinación que no se vende.
4. **Al guardar,** en una sola transacción se guardan las variaciones y se recalculan `variationCount`, `variationSummary` y `label`.
5. Un artículo **sin plantilla** es simple: no ve nada de variaciones.

## 4. Rendimiento: benchmark

**Escenario:** Postgres local (PGlite, WebAssembly), con:
- 4,000 artículos: 2,000 simples y 2,000 con 10 variaciones (Talla × Color), es decir 20,000 variaciones;
- saldos por variación;
- página de 30, en la página 51.

Las cifras sirven para **comparar** diseños entre sí. En el servidor real todo es más rápido, pero la proporción se mantiene. Cada ida a la base cuesta además ~110 ms de red, igual en todos los diseños.

| Operación | A) Resumen precalculado en Item | iii) Columnas option1..3 | ii) JSONB en variación | i) EAV |
|---|---|---|---|---|
| Lista de inventario, 30 artículos con resumen y existencia | **41 ms** | 105 ms (al vuelo) | 103 ms (al vuelo) | 175 ms |
| Filtrar artículos por atributo (Talla = M) | — | **17.5 ms** | 27.5 ms (GIN) | 26 ms |
| Ficha del artículo (10 variaciones con existencia) | — | 21 ms | 18 ms | 19 ms |
| POS: buscar variación por código de barras | — | **2.8 ms** | 4.4 ms | 5.8 ms |
| Guardar artículo con 10 variaciones (escritura) | — | 12.4 ms (+ resumen) | **9.5 ms** | 27.5 ms |
| Espacio para 20,000 variaciones | — | **4.3 MB** | 5.1 MB | 6.1 MB |

**Conclusiones:**
1. **La lista nunca debe unir variaciones ni atributos.** Con el resumen precalculado en `Item` la lista es **2.5 veces más rápida** que calcularlo al vuelo (41 contra 103–105 ms) y **4 veces más rápida** que EAV (175 ms).
   - Esto confirma la hipótesis: 1 consulta paginada sobre `Item`, sin joins extra.
   - Las variaciones solo se cargan al abrir la ficha, en 1 consulta.
2. **EAV pierde en todo:** en lectura, en escritura (3 veces más lenta) y en espacio. Se descarta.
3. **Columnas `option1..3` contra JSONB:** prácticamente empatan en la ficha. Las columnas ganan al filtrar por atributo (−36 %) y en el POS por código (−36 %). JSONB gana un poco al escribir (3 ms), y eso pasa solo al guardar el artículo.
   - **Recomendación:** columnas `option1..3` + `label` para los ejes, y JSONB (en `Item.attributes`) para la ficha técnica.
4. **Costo de escritura del resumen:** recalcular `variationSummary` al guardar cuesta menos de 3 ms dentro de la misma transacción. No se nota.
5. **Kardex, saldos, lotes y ventas:** 0 impacto. Siguen usando `itemVariationId` igual que hoy, con los mismos índices (`InventoryBalance` por almacén, artículo y variación; kardex por almacén, artículo, variación y secuencia).

## 5. Plan de migración por fases

Cada fase se puede desplegar sola y revertir.

| Fase | Qué incluye | Riesgo | Esfuerzo |
|---|---|---|---|
| **1. Esquema aditivo** | Tablas de plantilla; `Item.templateId`, `attributes`, `variationCount` y `variationSummary`; `ItemVariation.option1..3`, `label` y `extra`. Copia de datos: `size`→`option1`, `color`→`option2`, `label = color / size`. Se crea por empresa la plantilla del sistema "Talla y color" y se asigna a los artículos que ya tienen variaciones. Se calcula el resumen. **No se borra nada:** `color` y `size` se quedan. | Bajo (solo agrega) | 1 día |
| **2. Escritura doble** | `buildVariationRows` y `syncVariations` guardan `option*`, `label` y el resumen además de `color`/`size`. | Bajo | 0.5 día |
| **3. Administración de plantillas** | CRUD en Catálogos › Plantillas (atributos, tipo, opciones, de variación, obligatorio) y plantilla sugerida en Categoría. | Bajo | 1.5 días |
| **4. Modal de artículo** | Selector de plantilla, ficha técnica dinámica y matriz de combinaciones (reemplaza a VariationsModal). | Medio (es la pantalla más usada) | 2–3 días |
| **5. Listas y POS** | La columna "Tallas" pasa a "Variaciones" con `variationSummary`; POS, tickets, kardex y reportes muestran `label`; se cambian los ~16 lugares que leen `.size` o `.color`. | Medio | 2 días |
| **6. Limpieza** | Cuando ya nada lea `color`/`size`, se vuelven opcionales (y más adelante se eliminan). | Bajo | 0.5 día |

**Reversión:** hasta la fase 5, `color` y `size` siguen al día. Revertir es volver a la versión anterior del front y del back; las columnas nuevas se ignoran.

## 6. Qué cambia en cada lugar

- **Listas** (inventario, artículos, existencias): lee `variationCount` y `variationSummary` de `Item`. La consulta queda más simple y rápida, porque deja de unir `ItemVariation` para el resumen.
- **POS:** la búsqueda por código o SKU de variación queda igual. Muestra `label`. Al elegir un artículo con variaciones, el selector usa los nombres de los ejes de la plantilla.
- **Kardex, saldos y lotes:** sin cambios de datos. Solo muestran `label` donde hoy dicen talla y color.
- **Reportes y exportaciones** (CSV/PDF): una columna "Variación" con `label`, en vez de "Talla" y "Color". Si se quiere, columnas por eje con el nombre de la plantilla.
- **Entradas, salidas y traspasos:** el selector de variación muestra `label`.

## 7. Preguntas abiertas para ti

1. ¿Máximo **3 ejes** de variación por artículo te alcanza? ML usa 2 o 3; Shopify, 3.
2. ¿La plantilla se **sugiere por categoría** (como ML) o se elige siempre a mano?
3. ¿Quieres **precio e imagen por variación** en la matriz desde la fase 4? Hoy el modelo ya los soporta.
4. ¿Los atributos de ficha técnica deben servir como **filtros** en las listas (por ejemplo, filtrar por Marca)? Si sí, se agrega un índice GIN en `Item.attributes`, de bajo costo.
5. ¿Plantillas **del sistema** listas para usar (Ropa, Calzado, Bebidas, Electrónica) o cada empresa crea las suyas desde cero?
