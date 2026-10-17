#!/usr/bin/env node
/**
 * Genera, a partir de taxonomy.mjs:
 *   fixora-erp/src/core/modules/taxonomy.generated.ts        (menú, rutas, etiquetas)
 *   fixora-erp/src/modules/<módulo>/<grupo>/<pantalla>/       (carpeta por pantalla nueva, con .gitkeep)
 *   back-end-fixora-erp/src/common/modules-taxonomy.generated.ts   (catálogo de módulos y permisos)
 *   back-end-admin-fixora/prisma/modules-taxonomy.generated.ts     (catálogo completo de licencias, para el seed)
 *   back-end-admin-fixora/src/licenses/modules-catalog.generated.ts (la misma lista, para "Sincronizar catálogo" en el panel)
 *   fixora-admin-erp/src/lib/modules-taxonomy.generated.ts         (orden, nombre, icono y pantallas para el panel de admin)
 *
 *   node scripts/modules/generate.mjs          # escribe
 *   node scripts/modules/generate.mjs --check  # solo verifica que lo generado esté al día (para CI)
 *
 * Es idempotente: no borra archivos que hayas creado dentro de las carpetas de pantalla.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODULES, SHORTCUTS, LEGACY_LICENSE_ROWS } from './taxonomy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const erp = path.resolve(here, '../..'); // fixora-erp
const root = path.resolve(erp, '..'); // carpeta que contiene los 4 repos
const CHECK = process.argv.includes('--check');

const slug = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Módulos de licencia que YA existen en los catálogos de los backends (no se vuelven a registrar como nuevos).
const LEGACY_LICENSE_KEYS = ['dashboard', 'sales', 'customers', 'cobranza', 'shopping', 'cash-register', 'production', 'store', 'catalogos', 'reports', 'income', 'users', 'configurations'];

// ── Normalización ──
const taxonomy = MODULES.map((m) => {
  const groups = m.groups.map((g) => {
    const groupKey = g.label ? slug(g.label) : null;
    const screens = g.screens.map((s) => {
      const screen = typeof s === 'string' ? { label: s, live: false } : s;
      const screenSlug = slug(screen.label);
      const key = groupKey ? `${groupKey}-${screenSlug}` : screenSlug;
      const base = `${m.key}/${groupKey ? `${groupKey}/` : ''}${screenSlug}`;
      return {
        key,
        label: screen.label,
        live: !!screen.live,
        path: screen.live ? screen.path : base,
        permission: screen.live ? screen.permission : (screen.permission ?? `${m.key}.${key}.view`),
        own: !screen.live && !!screen.permission, // pantalla nueva que usa un permiso que ya existe (ej. accounting.view)
        ...(screen.live ? {} : { folder: `src/modules/${base}` }),
      };
    });
    return { key: groupKey, label: g.label, screens };
  });
  return { key: m.key, label: m.label, icon: m.icon, symbol: m.symbol, order: m.order, description: m.description, requiredPermission: m.ownerOnly ? m.requiredPermission : (m.requiredPermission ?? `${m.key}.view`), ownerOnly: m.ownerOnly, includedIn: m.includedIn, sections: m.sections, price: m.price, groups };
});

// ── Validaciones ──
const errors = [];
const keys = new Set(); const paths = new Set(); const perms = new Set();
for (const m of taxonomy) {
  if (keys.has(m.key)) errors.push(`Módulo repetido: ${m.key}`);
  keys.add(m.key);
  for (const g of m.groups) for (const s of g.screens) {
    if (!s.live && paths.has(s.path)) errors.push(`Ruta repetida: ${s.path}`);
    if (!s.live && !s.own && perms.has(s.permission)) errors.push(`Permiso repetido: ${s.permission}`);
    paths.add(s.path); if (!s.live && !s.own) perms.add(s.permission);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const moduleLabels = Object.fromEntries(taxonomy.map((m) => [m.key, m.label]));
const submoduleLabels = {};
const placeholderPermissions = [];
// Módulos sin permiso propio todavía (los nuevos): su acceso general es `<módulo>.view` (+ crear y gestionar).
const EXISTING_MODULE_PERMS = new Set(taxonomy.filter((m) => MODULES.find((x) => x.key === m.key)?.requiredPermission).map((m) => m.key));
for (const m of taxonomy) {
  if (m.ownerOnly || EXISTING_MODULE_PERMS.has(m.key)) continue;
  placeholderPermissions.push({ name: `${m.key}.view`, description: `Ver el módulo ${m.label}` });
  placeholderPermissions.push({ name: `${m.key}.create`, description: `Crear en ${m.label}` });
  placeholderPermissions.push({ name: `${m.key}.manage`, description: `Gestionar ${m.label}` });
}
for (const m of taxonomy) for (const g of m.groups) for (const s of g.screens) {
  if (s.live || s.own) continue;
  submoduleLabels[`${m.key}.${s.key}`] = g.label ? `${g.label} › ${s.label}` : s.label;
  const where = `${g.label ? `${g.label} › ` : ''}${s.label} (${m.label})`;
  // Cada pantalla nueva trae las 3 acciones estándar del ERP: ver, crear y gestionar (editar/eliminar/aprobar).
  placeholderPermissions.push({ name: s.permission, description: `Ver ${where}` });
  const base = s.permission.slice(0, -'.view'.length);
  placeholderPermissions.push({ name: `${base}.create`, description: `Crear en ${where}` });
  placeholderPermissions.push({ name: `${base}.manage`, description: `Gestionar ${where}` });
}

const ts = (o) => JSON.stringify(o, null, 2);
const HEADER = '// ARCHIVO GENERADO por fixora-erp/scripts/modules/generate.mjs a partir de taxonomy.mjs — no editar a mano.\n';
const outputs = new Map();

// 1) Frontend
outputs.set(path.join(erp, 'src/core/modules/taxonomy.generated.ts'), `${HEADER}
export interface TaxScreen {
  key: string
  label: string
  /** Ruta relativa al área privada (se le antepone /auth/) */
  path: string
  /** Permiso (o cualquiera de varios) para ver la pantalla */
  permission?: string | string[]
  /** true = la pantalla ya existe; false = se muestra "en construcción" hasta que exista src/modules/<ruta>/index.tsx */
  live: boolean
  own?: boolean
  folder?: string
}
export interface TaxGroup { key: string | null; label: string | null; screens: TaxScreen[] }
export interface TaxModule {
  key: string
  label: string
  icon: string
  order: number
  description: string
  requiredPermission?: string
  ownerOnly?: boolean
  includedIn?: string[]
  groups: TaxGroup[]
}
export interface TaxShortcut { key: string; label: string; icon: string; order: number; path: string; requiredPermission?: string; includedIn?: string[] }

export const TAXONOMY: TaxModule[] = ${ts(taxonomy.map(({ symbol, sections, price, ...rest }) => rest))}

export const SHORTCUTS: TaxShortcut[] = ${ts(SHORTCUTS)}

/** Nombre visible de cada módulo (para roles, permisos y licencias). */
export const MODULE_LABELS: Record<string, string> = ${ts(moduleLabels)}

/** Nombre visible del "submódulo" de un permiso nuevo: clave "<módulo>.<pantalla>" → "Grupo › Pantalla". */
export const SUBMODULE_LABELS: Record<string, string> = ${ts(submoduleLabels)}
`);

// 2) Backend del ERP: catálogo y permisos
const catalog = taxonomy.map((m) => ({ key: m.key, name: m.label, description: m.description }));
outputs.set(path.join(root, 'back-end-fixora-erp/src/common/modules-taxonomy.generated.ts'), `${HEADER}
/** Módulos de licencia de la taxonomía (clave estable + nombre editable). */
export const TAXONOMY_MODULES: { key: string; name: string; description: string }[] = ${ts(catalog)};

/** Permisos de las pantallas nuevas (solo "ver"; crear/gestionar se agregan cuando la pantalla exista). */
export const SCREEN_PERMISSIONS: { name: string; description: string }[] = ${ts(placeholderPermissions)};

/** "<módulo>.<pantalla>" → "Grupo › Pantalla" para mostrar los permisos nuevos con nombre legible. */
export const SCREEN_PERMISSION_LABELS: Record<string, string> = ${ts(submoduleLabels)};

export const MODULE_DISPLAY_NAMES: Record<string, string> = ${ts(moduleLabels)};
`);

// 2b) Panel de admin (frontend): orden, nombre, icono y pantallas de cada módulo, solo lectura
const adminModules = taxonomy.filter((m) => !m.ownerOnly).map((m) => ({
  key: m.key, label: m.label, symbol: m.symbol, order: m.order, description: m.description,
  groups: m.groups.map((g) => ({ key: g.key, label: g.label, screens: g.screens.map((s) => ({ label: s.label, live: s.live })) })),
}));
outputs.set(path.join(root, 'fixora-admin-erp/src/lib/modules-taxonomy.generated.ts'), `${HEADER}
export interface TaxonomyModule {
  key: string
  label: string
  /** Icono Material Symbols */
  symbol: string
  order: number
  description: string
  groups: { key: string | null; label: string | null; screens: { label: string; live: boolean }[] }[]
}

export const TAXONOMY_MODULES: TaxonomyModule[] = ${ts(adminModules)}
`);

// 3) Catálogo COMPLETO de licencias para el seed del admin: módulo → secciones con precio → submódulos (grupos) → heredados
const licenseCatalog = [];
for (const m of taxonomy.filter((x) => !x.ownerOnly)) {
  const existing = LEGACY_LICENSE_KEYS.includes(m.key); // el módulo ya estaba en el catálogo: el seed conserva su precio
  licenseCatalog.push({ key: m.key, name: m.label, level: 'module', priceMonthly: m.price?.[0] ?? 0, priceAnnual: m.price?.[1] ?? 0, managed: existing ? 'seed' : 'admin' });
  for (const [suffix, name, monthly, annual] of m.sections ?? []) {
    licenseCatalog.push({ key: `${m.key}.${suffix}`, name, level: 'section', priceMonthly: monthly, priceAnnual: annual, managed: 'seed' });
  }
  for (const g of m.groups.filter((x) => x.label)) {
    licenseCatalog.push({ key: `${m.key}.${g.key}`, name: g.label, level: 'submodule', priceMonthly: 0, priceAnnual: 0, managed: 'admin' });
  }
}
for (const row of LEGACY_LICENSE_ROWS) licenseCatalog.push({ ...row, level: 'legacy', managed: 'seed' });
const seen = new Set();
for (const row of licenseCatalog) { if (seen.has(row.key)) { console.error(`Clave de licencia repetida: ${row.key}`); process.exit(1); } seen.add(row.key); }

const catalogFile = `${HEADER}
/**
 * Catálogo completo de licencias (módulos y submódulos), en el orden del menú.
 *   level   module = módulo · section = sección con precio propio (heredada) · submodule = grupo de pantallas · legacy = ya sin menú
 *   managed seed  = el seed fija nombre Y precio (como siempre)
 *           admin = el seed solo pone el nombre; el precio lo fija el panel de admin y el seed NUNCA lo pisa
 */
export interface CatalogRow {
  key: string
  name: string
  level: 'module' | 'section' | 'submodule' | 'legacy'
  priceMonthly: number
  priceAnnual: number
  managed: 'seed' | 'admin'
}

export const MODULE_CATALOG: CatalogRow[] = ${ts(licenseCatalog)};
`;
// Una copia para el seed (prisma/) y otra para el botón "Sincronizar catálogo" del panel (src/)
outputs.set(path.join(root, 'back-end-admin-fixora/prisma/modules-taxonomy.generated.ts'), catalogFile);
outputs.set(path.join(root, 'back-end-admin-fixora/src/licenses/modules-catalog.generated.ts'), catalogFile);

// ── Escritura / verificación ──
let stale = 0;
for (const [file, content] of outputs) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (current === content) continue;
  stale++;
  if (!CHECK) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }
}

// 4) Carpetas de pantallas nuevas
let folders = 0;
for (const m of taxonomy) for (const g of m.groups) for (const s of g.screens) {
  if (s.live) continue;
  const dir = path.join(erp, s.folder);
  const keep = path.join(dir, '.gitkeep');
  if (!fs.existsSync(dir) && !fs.existsSync(keep)) {
    folders++;
    if (!CHECK) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(keep, ''); }
  }
}

const total = taxonomy.reduce((a, m) => a + m.groups.reduce((b, g) => b + g.screens.length, 0), 0);
const live = taxonomy.reduce((a, m) => a + m.groups.reduce((b, g) => b + g.screens.filter((s) => s.live).length, 0), 0);
console.log(`${taxonomy.length} módulos · ${total} pantallas (${live} ya existen, ${total - live} nuevas) · ${placeholderPermissions.length} permisos nuevos`);
if (CHECK) { console.log(stale || folders ? `✗ Desactualizado: ${stale} archivos y ${folders} carpetas` : '✓ Todo está al día'); process.exit(stale || folders ? 1 : 0); }
console.log(`Archivos escritos: ${stale} · carpetas nuevas: ${folders}`);
