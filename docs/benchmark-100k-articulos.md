# Benchmark: ¿aguanta Fixora 100 mil y 500 mil artículos?

> Medido con el **esquema real** (prisma/schema.prisma) y la **consulta real** de `InventoryService.getInventoryPage`, en un Postgres local de pruebas (PGlite, WebAssembly). Nunca en la base del usuario.
>
> Ojo con las cifras absolutas: PGlite es de un solo hilo y bastante más lento que un Postgres nativo (estimo de 3 a 10 veces). Lo que vale es la **comparación** entre "actual" y "mejorado", que se mantiene en cualquier servidor.
>
> **Datos sintéticos:**
> - 70 % de artículos simples y 30 % con 3 a 20 variaciones;
> - saldos en 2 o 3 almacenes;
> - 2 sucursales y 40 categorías;
> - algunos lotes y algunos movimientos de kardex.
>
> **Corridas:** 5 por cada consulta pesada a 100 mil y 2 a 500 mil (son muy lentas); 20 a 30 por cada una de las rápidas.
>
> **Columnas de "total":** suman el tiempo de la consulta más la red, con ~110 ms por ida a la base en producción (Supabase) o ~3 ms si el backend está junto a la base.

## Resultados

## 100,000 artículos: 339,988 variaciones, 649,982 saldos (carga 108 s)
| Operación | p50 ms | p95 ms | idas a la base | total prod. (110 ms/ida) | total con back junto a la base (3 ms/ida) |
|---|---|---|---|---|---|
| **ACTUAL** (consulta de getInventoryPage) | | | | | |
| Lista página 1 | 7006 | 7649 | 1 | 7116 | 7009 |
| Lista página 500 | 6998 | 8075 | 1 | 7108 | 7001 |
| Lista última página (3334) | 6943 | 7967 | 1 | 7053 | 6946 |
| Búsqueda parcial "aceite" | 7231 | 8427 | 1 | 7341 | 7234 |
| Búsqueda por código exacto | 7140 | 8162 | 1 | 7250 | 7143 |
| Filtro estado stock_bajo + sucursal 2 | 4098 | 5088 | 1 | 4208 | 4101 |
| Conteo total separado (COUNT de artículos activos) | 107 | 158 | 1 | 217 | 110 |
| POS: código de barras de variación | 4 | 10 | 1 | 114 | 7 |
| POS: código de barras de artículo | 4 | 12 | 1 | 114 | 7 |
| POS: prefijo de código "ABR-00043" | 5 | 13 | 1 | 115 | 8 |
| Ficha del artículo con variaciones (detail) | 21 | 28 | 1 | 131 | 24 |
| Guardar artículo con 20 variaciones (transacción) | 20 | 32 | 1 | 130 | 23 |
| **MEJORADO** (existencia precalculada + índice de lista + keyset + totales cacheados) | | | | | |
| Lista página 1 | 6 | 9 | 1 | 116 | 9 |
| Lista página 500 (keyset) | 6 | 12 | 1 | 116 | 9 |
| Lista última página (keyset) | 7 | 11 | 1 | 117 | 10 |
| Lista página 500 con OFFSET (sin keyset) | 228 | 369 | 1 | 338 | 231 |
| Búsqueda parcial "aceite" (trigram) | 6 | 11 | 1 | 116 | 9 |
| Búsqueda "aceite 7c" (trigram, más selectiva) | 20 | 37 | 1 | 130 | 23 |
| Filtro estado stock_bajo + categoría 7 | 20 | 45 | 1 | 130 | 23 |
| Conteo con tope "más de 10,000" (como ML) | 50 | 55 | 1 | 160 | 53 |

## 500,000 artículos: 1,699,988 variaciones, 3,249,982 saldos (carga 592 s)
| Operación | p50 ms | p95 ms | idas a la base | total prod. (110 ms/ida) | total con back junto a la base (3 ms/ida) |
|---|---|---|---|---|---|
| **ACTUAL** (consulta de getInventoryPage) | | | | | |
| Lista página 1 | 69432 | 69432 | 1 | 69542 | 69435 |
| Lista página 500 | 62252 | 62252 | 1 | 62362 | 62255 |
| Lista última página (16667) | 74005 | 74005 | 1 | 74115 | 74008 |
| Búsqueda parcial "aceite" | 64202 | 64202 | 1 | 64312 | 64205 |
| Búsqueda por código exacto | 64626 | 64626 | 1 | 64736 | 64629 |
| Filtro estado stock_bajo + sucursal 2 | 44513 | 44513 | 1 | 44623 | 44516 |
| Conteo total separado (COUNT de artículos activos) | 421 | 563 | 1 | 531 | 424 |
| POS: código de barras de variación | 4 | 13 | 1 | 114 | 7 |
| POS: código de barras de artículo | 2 | 10 | 1 | 112 | 5 |
| POS: prefijo de código "ABR-00043" | 4 | 11 | 1 | 114 | 7 |
| Ficha del artículo con variaciones (detail) | 17 | 26 | 1 | 127 | 20 |
| Guardar artículo con 20 variaciones (transacción) | 18 | 37 | 1 | 128 | 21 |
| **MEJORADO** (existencia precalculada + índice de lista + keyset + totales cacheados) | | | | | |
| Lista página 1 | 12 | 16 | 1 | 122 | 15 |
| Lista página 500 (keyset) | 16 | 71 | 1 | 126 | 19 |
| Lista última página (keyset) | 17 | 101 | 1 | 127 | 20 |
| Lista página 500 con OFFSET (sin keyset) | 328 | 882 | 1 | 438 | 331 |
| Búsqueda parcial "aceite" (trigram) | 8 | 15 | 1 | 118 | 11 |
| Búsqueda "aceite 7c" (trigram, más selectiva) | 33 | 40 | 1 | 143 | 36 |
| Filtro estado stock_bajo + categoría 7 | 1791 | 2149 | 1 | 1901 | 1794 |
| Conteo con tope "más de 10,000" (como ML) | 115 | 130 | 1 | 225 | 118 |

## Qué dicen los números

1. **La lista actual no escala.** Calcula existencia y estado de **todo el catálogo** en cada página, para el resumen y los filtros de estado.
   - Con 100 mil artículos tarda ~7 s por página en PGlite, igual la página 1 que la última, porque el costo no depende de la página.
   - Con 500 mil tarda ~74 s.
   - Con los 4,000 artículos de hoy no se nota, pero crece en línea recta con el catálogo.
2. **Lo que ya va bien:**
   - Búsqueda por código de barras (POS) de artículo o variación: 4–5 ms.
   - Prefijo de código: 5 ms.
   - Ficha del artículo: 17–21 ms.
   - Guardar un artículo con 20 variaciones: 18–20 ms.
   Las cuatro usan índices y no dependen del tamaño del catálogo.
3. **Con la mejora** (existencia y estado precalculados por artículo, índice para la lista, paginación por cursor y totales guardados):
   - La lista baja a **6–17 ms** en cualquier página, tanto a 100 mil como a 500 mil.
   - La búsqueda parcial con el índice trigram, que ya existe, tarda **6–33 ms**.
4. **OFFSET contra cursor:** la página 500 con OFFSET tarda 228 ms (100k) y 328 ms (500k); con cursor, 6–16 ms. Para listas largas conviene el cursor ("Siguiente / Anterior").
5. **Conteo:** contar exacto los 100 mil activos tarda 107 ms. Contar con tope "más de 10,000", como Mercado Libre, tarda 50–115 ms. Lo mejor es guardar los totales por empresa y mostrar "más de 10,000" cuando aplique.
6. **Filtro estado + categoría a 500 mil** sin índice compuesto: 1.8 s. Necesita un índice por (empresa, estado, categoría) en la tabla de existencia precalculada.
7. **La red pesa más que la consulta:** cada ida a la base suma ~110 ms. Ya se dejó todo en 1 ida por pantalla. Acercar el backend a la base (misma región o mismo servidor) quita ~100 ms por petición.

## Qué haría (sin aplicar todavía)

1. **Tabla `item_stock`** (por artículo y sucursal, más el total de la empresa) con existencia, estado y número de variaciones.
   - Se actualiza en la misma transacción que `InventoryBalance` (en el ledger de inventario).
   - Necesita una migración nueva con su llenado inicial.
   - Índices: (empresa, activo, nombre, id) y (empresa, estado, categoría).
2. **Lista por cursor** en lugar de OFFSET y **totales guardados** por empresa: se actualizan con cada movimiento o cada pocos segundos.
3. **Índice compuesto** en `Item` (companyId, active, name, id). El trigram ya existe.
4. **Backend en la misma región que la base.**

## Recomendación

- **Hasta ~500 mil artículos por empresa, PostgreSQL basta** con lo anterior: listas de 10–30 ms en servidor más la red.
- **Más arriba, o si se quiere búsqueda con tolerancia a errores de escritura y facetas** (como Mercado Libre), conviene un buscador dedicado (Meilisearch, Typesense u OpenSearch), alimentado desde Postgres. **No lo medí:** es una estimación, porque levantarlo requería instalar software en tu equipo.
