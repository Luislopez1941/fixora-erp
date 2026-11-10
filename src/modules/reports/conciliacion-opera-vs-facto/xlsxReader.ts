/**
 * Lector mínimo de Excel (.xlsx) y CSV/TXT en el navegador, sin dependencias.
 * Un .xlsx es un ZIP con XML adentro: se lee el índice del ZIP, se descomprime cada parte con
 * `DecompressionStream('deflate-raw')` y se interpretan los XML con DOMParser.
 */

export type Cell = string | number | null
export interface SheetData {
  /** Nombre que se muestra: "archivo › hoja" (o solo la hoja si hay un archivo). */
  name: string
  sheet: string
  file: string
  rows: Cell[][]
}

const td = new TextDecoder('utf-8')

/** Tamaño máximo por archivo subido. */
export const MAX_FILE_MB = 80
/** Tope de lo que puede ocupar un .xlsx ya descomprimido (evita que un archivo dañado o malicioso congele la página). */
const MAX_UNZIPPED = 600 * 1024 * 1024

interface ZipEntry { name: string; method: number; compSize: number; size: number; offset: number }

function readZipIndex(buf: ArrayBuffer): Map<string, ZipEntry> {
  const dv = new DataView(buf)
  // Fin del directorio central (firma 0x06054b50), buscando desde el final (puede haber comentario)
  let eocd = -1
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('El archivo no es un Excel (.xlsx) válido.')
  const count = dv.getUint16(eocd + 10, true)
  let p = dv.getUint32(eocd + 16, true)
  const entries = new Map<string, ZipEntry>()
  for (let n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break
    const method = dv.getUint16(p + 10, true)
    const compSize = dv.getUint32(p + 20, true)
    const size = dv.getUint32(p + 24, true)
    const nameLen = dv.getUint16(p + 28, true)
    const extraLen = dv.getUint16(p + 30, true)
    const commentLen = dv.getUint16(p + 32, true)
    const local = dv.getUint32(p + 42, true)
    const name = td.decode(new Uint8Array(buf, p + 46, nameLen))
    // Los datos empiezan después del encabezado local (sus longitudes pueden diferir del central)
    const lNameLen = dv.getUint16(local + 26, true)
    const lExtraLen = dv.getUint16(local + 28, true)
    // Clave en minúsculas: algunos exportadores escriben 'xl/SharedStrings.xml' o rutas con otra capitalización
    entries.set(name.replace(/^\//, '').toLowerCase(), { name, method, compSize, size, offset: local + 30 + lNameLen + lExtraLen })
    p += 46 + nameLen + extraLen + commentLen
  }
  let total = 0
  for (const e of entries.values()) {
    if (e.offset + e.compSize > buf.byteLength) throw new Error('El archivo .xlsx está incompleto o dañado.')
    total += e.size
  }
  if (total > MAX_UNZIPPED) throw new Error('El Excel es demasiado grande para analizarlo en el navegador. Deja solo las hojas OPERA FACTURADO y Facto.')
  return entries
}

async function readZipText(buf: ArrayBuffer, entry: ZipEntry): Promise<string> {
  const raw = new Uint8Array(buf, entry.offset, entry.compSize)
  if (entry.method === 0) return td.decode(raw)
  if (entry.method !== 8) throw new Error(`Compresión no soportada en ${entry.name}`)
  try {
    const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return await new Response(stream).text()
  } catch {
    throw new Error('El archivo .xlsx está dañado: no se pudo descomprimir. Ábrelo en Excel, guárdalo de nuevo y vuelve a subirlo.')
  }
}

const xml = (text: string) => new DOMParser().parseFromString(text, 'application/xml')
const tags = (node: Document | Element, local: string) => Array.from(node.getElementsByTagNameNS('*', local))

function colIndex(ref: string): number {
  const letters = ref.replace(/[^A-Z]/gi, '').toUpperCase()
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function resolveTarget(target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = ('xl/' + target).split('/')
  const out: string[] = []
  for (const part of parts) {
    if (part === '..') out.pop()
    else if (part && part !== '.') out.push(part)
  }
  return out.join('/')
}

async function readXlsx(file: File): Promise<SheetData[]> {
  const buf = await file.arrayBuffer()
  let zip: Map<string, ZipEntry>
  try {
    zip = readZipIndex(buf)
  } catch (e) {
    // Errores de bajo nivel (offsets fuera de rango) se muestran con un mensaje entendible
    throw new Error(e instanceof Error && !(e instanceof RangeError) ? e.message : `"${file.name}" está dañado o no es un Excel válido.`)
  }
  const get = async (path: string) => {
    const entry = zip.get(path.replace(/^\//, '').toLowerCase())
    return entry ? readZipText(buf, entry) : null
  }

  const wbText = await get('xl/workbook.xml')
  const relsText = await get('xl/_rels/workbook.xml.rels')
  if (!wbText || !relsText) throw new Error('El archivo no parece un libro de Excel (.xlsx).')
  const rels = new Map(tags(xml(relsText), 'Relationship').map((r) => [r.getAttribute('Id') ?? '', r.getAttribute('Target') ?? '']))

  const shared: string[] = []
  // La tabla de textos compartidos se toma de las relaciones del libro (no siempre se llama igual)
  const sstRel = tags(xml(relsText), 'Relationship').find((r) => /sharedStrings$/i.test(r.getAttribute('Type') ?? ''))
  const sst = (sstRel ? await get(resolveTarget(sstRel.getAttribute('Target') ?? '')) : null) ?? (await get('xl/sharedStrings.xml'))
  if (sst) {
    for (const si of tags(xml(sst), 'si')) {
      // Concatena los textos, sin la guía fonética (rPh)
      shared.push(tags(si, 't').filter((t) => (t.parentElement?.localName ?? '') !== 'rPh').map((t) => t.textContent ?? '').join(''))
    }
  }

  const out: SheetData[] = []
  for (const sheet of tags(xml(wbText), 'sheet')) {
    const sheetName = sheet.getAttribute('name') ?? 'Hoja'
    // r:id puede venir con otro prefijo o en el espacio de nombres de OOXML estricto: se busca cualquier atributo *:id
    const rid = Array.from(sheet.attributes).find((at) => at.localName === 'id' && at.name.includes(':'))?.value ?? ''
    const target = rels.get(rid)
    if (!target) continue
    const text = await get(resolveTarget(target))
    if (!text) continue
    const rows: Cell[][] = []
    for (const row of tags(xml(text), 'row')) {
      const r = Number(row.getAttribute('r') ?? rows.length + 1) - 1
      const values: Cell[] = []
      let next = 0
      for (const c of tags(row, 'c')) {
        const ref = c.getAttribute('r')
        const ci = ref ? colIndex(ref) : next
        next = ci + 1
        const type = c.getAttribute('t')
        const v = tags(c, 'v')[0]?.textContent ?? null
        let value: Cell = null
        if (type === 's') value = v == null ? null : shared[Number(v)] ?? ''
        else if (type === 'inlineStr') value = tags(c, 't').map((t) => t.textContent ?? '').join('')
        else if (type === 'str' || type === 'e') value = v
        else if (type === 'b') value = v === '1' ? 'VERDADERO' : 'FALSO'
        else if (v != null && v !== '') value = Number.isFinite(Number(v)) ? Number(v) : v
        values[ci] = value
      }
      rows[r] = Array.from(values, (x) => x ?? null)
    }
    out.push({ name: sheetName, sheet: sheetName, file: file.name, rows: Array.from(rows, (x) => x ?? []) })
  }
  return out
}

/** CSV o texto separado por tabulador / coma / punto y coma (lo que tenga más columnas en el encabezado). */
function parseDelimited(text: string): Cell[][] {
  const clean = text.replace(/^\uFEFF/, '')
  const firstLines = clean.split(/\r?\n/).slice(0, 5).join('\n')
  const delim = ['\t', ';', ','].map((d) => [d, firstLines.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0]
  const rows: Cell[][] = []
  let row: Cell[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"' && field === '') quoted = true
    else if (ch === delim) { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += ch
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

export async function readWorkbookFiles(files: File[]): Promise<SheetData[]> {
  const sheets: SheetData[] = []
  for (const file of files) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`"${file.name}" pesa más de ${MAX_FILE_MB} MB. Deja solo las hojas OPERA FACTURADO y Facto y vuelve a subirlo.`)
    const lower = file.name.toLowerCase()
    if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm')) {
      sheets.push(...(await readXlsx(file)))
    } else if (lower.endsWith('.xls')) {
      throw new Error(`"${file.name}" es Excel 97-2003 (.xls). Guárdalo como .xlsx y vuelve a subirlo.`)
    } else {
      const base = file.name.replace(/\.[^.]+$/, '')
      sheets.push({ name: base, sheet: base, file: file.name, rows: parseDelimited(await file.text()) })
    }
  }
  const multipleFiles = new Set(sheets.map((s) => s.file)).size > 1
  return sheets.map((s) => ({ ...s, name: multipleFiles && s.file.replace(/\.[^.]+$/, '') !== s.sheet ? `${s.file} › ${s.sheet}` : s.sheet }))
}
