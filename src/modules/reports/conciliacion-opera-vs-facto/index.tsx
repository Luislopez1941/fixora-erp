import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useCan } from '../../../core/permissions/useCan'
import { MAX_FILE_MB, readWorkbookFiles, type SheetData } from './xlsxReader'
import {
  FACTO_REQUIRED, OPERA_REQUIRED, describeHeaders, normHeader, readFacto, readOpera, reconcile, sheetHas,
} from './reconcile'
import { exportFacto, exportOpera } from './exportCsv'
import { pdfResumen } from './exportPdf'
import { xlsxReporteCompleto } from './exportXlsx'
import { applyAdjustments, type Adjustment, type AdjustmentInput } from './adjustments'
import { adjustmentsApi } from './adjustmentsApi'
import Results from './Results'
import './Conciliacion.css'

const PERMISSION = 'reports.conciliacion-opera-vs-facto.view'

const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
  <span className={`material-symbols-rounded ${className ?? ''}`} aria-hidden>{name}</span>
)

/** Adivina qué hoja es OPERA y cuál Facto: primero por columnas (el nombre solo desempata). */
const guessSheet = (sheets: SheetData[], word: RegExp, required: string[][], avoid?: string) => {
  const fits = sheets.filter((s) => s.name !== avoid && sheetHas(s.rows, required))
  return (fits.find((s) => word.test(normHeader(s.sheet))) ?? fits[0])?.name ?? ''
}

const Conciliacion: React.FC = () => {
  const can = useCan()
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [files, setFiles] = useState<string[]>([])
  const [operaSheet, setOperaSheet] = useState('')
  const [factoSheet, setFactoSheet] = useState('')
  const [tolerance, setTolerance] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [panel, setPanel] = useState<'' | 'how' | 'sheets'>('')
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const userName = useSelector((s: { user?: { name?: string; email?: string } }) => s.user?.name || s.user?.email || 'Usuario')

  // Ajustes manuales guardados (hoy en simulación; ver adjustmentsApi.ts)
  useEffect(() => {
    let alive = true
    adjustmentsApi.list().then((list) => { if (alive) setAdjustments(list) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const saveAdjustment = useCallback(async (input: AdjustmentInput) => {
    await adjustmentsApi.save(input)
    setAdjustments(await adjustmentsApi.list())
  }, [])

  const removeAdjustment = useCallback(async (id: string) => {
    await adjustmentsApi.remove(id)
    setAdjustments(await adjustmentsApi.list())
  }, [])
  // Hojas vigentes y número de carga: si se suelta otro archivo mientras se lee el anterior, gana el último
  const sheetsRef = useRef<SheetData[]>([])
  const loadId = useRef(0)

  const onDrop = async (accepted: File[], rejected: FileRejection[] = []) => {
    if (rejected.length) {
      const r = rejected[0]
      const tooBig = r.errors.some((e) => e.code === 'file-too-large')
      setLoadError(tooBig
        ? `"${r.file.name}" pesa más de ${MAX_FILE_MB} MB. Deja solo las hojas OPERA FACTURADO y Facto y vuelve a subirlo.`
        : `"${r.file.name}" no es un Excel (.xlsx) ni un CSV.`)
      if (!accepted.length) return
    }
    if (!accepted.length) return
    const id = ++loadId.current
    setLoading(true)
    if (!rejected.length) setLoadError('')
    try {
      const read = await readWorkbookFiles(accepted)
      if (id !== loadId.current) return
      if (!read.length) throw new Error('No encontramos hojas en el archivo.')
      // Si el archivo nuevo solo trae una de las dos (ej. un CSV de Facto), se conservan las hojas que ya estaban cargadas
      const hasOpera = !!guessSheet(read, /OPERA/, OPERA_REQUIRED)
      const hasFacto = !!guessSheet(read, /FACTO/, FACTO_REQUIRED, guessSheet(read, /OPERA/, OPERA_REQUIRED))
      const keepPrevious = !(hasOpera && hasFacto)
      const all = keepPrevious ? [...sheetsRef.current.filter((s) => !read.some((r) => r.name === s.name)), ...read] : read
      const opera = guessSheet(all, /OPERA/, OPERA_REQUIRED)
      sheetsRef.current = all
      setSheets(all)
      setFiles((prev) => [...new Set([...(keepPrevious ? prev : []), ...accepted.map((f) => f.name)])])
      setOperaSheet(opera)
      setFactoSheet(guessSheet(all, /FACTO/, FACTO_REQUIRED, opera))
    } catch (e) {
      if (id === loadId.current) setLoadError(e instanceof Error ? e.message : 'No se pudo leer el archivo.')
    } finally {
      if (id === loadId.current) setLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: MAX_FILE_MB * 1024 * 1024,
    noClick: sheets.length > 0,
    noKeyboard: sheets.length > 0,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xlsm'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt', '.tsv'],
    },
  })

  const analysis = useMemo(() => {
    const o = sheets.find((s) => s.name === operaSheet)
    const f = sheets.find((s) => s.name === factoSheet)
    if (!o || !f) return null
    // Una hoja sin columnas de OPERA (o la misma hoja en los dos lados) no se analiza: se muestra el aviso de "falta OPERA"
    if (o.name === f.name || !sheetHas(o.rows, OPERA_REQUIRED) || !sheetHas(f.rows, FACTO_REQUIRED)) return null
    try {
      return { data: reconcile(readOpera(o.rows), readFacto(f.rows), tolerance), error: '' }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'No se pudo analizar.' }
    }
  }, [sheets, operaSheet, factoSheet, tolerance])

  const baseData = analysis?.data ?? null
  // El resultado automático con los ajustes manuales encima: es lo que se muestra y lo que se descarga
  const data = useMemo(() => (baseData ? applyAdjustments(baseData, adjustments, tolerance) : null), [baseData, adjustments, tolerance])

  if (!can(PERMISSION)) {
    return (
      <div className='conciliacion'>
        <div className='conciliacion__state'>
          <Icon name='lock' />
          <p>No tienes permiso para ver la conciliación.</p>
        </div>
      </div>
    )
  }

  const missingOpera = !operaSheet || !sheets.some((x) => x.name === operaSheet && sheetHas(x.rows, OPERA_REQUIRED))
  const togglePanel = (p: 'how' | 'sheets') => setPanel((cur) => (cur === p ? '' : p))

  return (
    <div className='conciliacion'>
      <div className='conciliacion__container'>
        <h1 className='conciliacion__sr'>Conciliación OPERA vs Facto</h1>

        <section {...getRootProps({ className: `conciliacion__card conciliacion__source ${isDragActive ? 'is-drag' : ''} ${sheets.length ? 'is-loaded' : ''}` })}>
          <input {...getInputProps()} />
          {sheets.length ? (
            <>
              <div className='conciliacion__file'>
                <span className='conciliacion__file-icon'><Icon name={loading ? 'progress_activity' : 'description'} className={loading ? 'conciliacion__spin' : ''} /></span>
                <div className='conciliacion__file-text'>
                  <strong>{files.join(', ')}</strong>
                  <small>{sheets.length} {sheets.length === 1 ? 'hoja leída' : 'hojas leídas'} · también puedes soltar otro archivo aquí</small>
                </div>
                <div className='conciliacion__file-actions'>
                  {data ? (
                    <>
                      <button type='button' className='conciliacion__btn conciliacion__btn--tint' onClick={() => exportOpera(data.opera)}>
                        <Icon name='download' /> OPERA (CSV)
                      </button>
                      <button type='button' className='conciliacion__btn conciliacion__btn--primary' onClick={() => exportFacto(data.facto)}>
                        <Icon name='download' /> Facto (CSV)
                      </button>
                      <button type='button' className='conciliacion__btn conciliacion__btn--tint' onClick={() => xlsxReporteCompleto(data, adjustments)}>
                        <Icon name='table_view' /> Reporte (Excel)
                      </button>
                      <button type='button' className='conciliacion__btn conciliacion__btn--tint' onClick={() => pdfResumen(data, tolerance)}>
                        <Icon name='picture_as_pdf' /> Resumen (PDF)
                      </button>
                    </>
                  ) : null}
                  <button type='button' className='conciliacion__btn conciliacion__btn--tint' onClick={open}>
                    <Icon name='upload_file' /> Cambiar archivo
                  </button>
                </div>
              </div>

              <div className='conciliacion__settings'>
                <label>
                  <span>Hoja OPERA</span>
                  <select className='inputs__general' value={operaSheet} onChange={(e) => setOperaSheet(e.target.value)}>
                    <option value=''>Elegir…</option>
                    {sheets.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Hoja Facto</span>
                  <select className='inputs__general' value={factoSheet} onChange={(e) => setFactoSheet(e.target.value)}>
                    <option value=''>Elegir…</option>
                    {sheets.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </label>
                <label className='conciliacion__tolerance'>
                  <span>Tolerancia ($)</span>
                  <input className='inputs__general' type='number' min={0} step={0.5} value={tolerance} onChange={(e) => setTolerance(Math.max(0, Number(e.target.value) || 0))} />
                </label>
                <div className='conciliacion__links'>
                  <button type='button' className={`conciliacion__pill-btn ${panel === 'how' ? 'is-active' : ''}`} onClick={() => togglePanel('how')} aria-expanded={panel === 'how'}>
                    <Icon name='help' /> ¿Cómo se cruza?
                  </button>
                  <button type='button' className={`conciliacion__pill-btn ${panel === 'sheets' ? 'is-active' : ''}`} onClick={() => togglePanel('sheets')} aria-expanded={panel === 'sheets'}>
                    <Icon name='table_rows' /> Hojas leídas
                  </button>
                </div>
              </div>

              {panel === 'how' ? (
                <div className='conciliacion__panel'>
                  <ol>
                    <li><strong>UUID:</strong> FOLIO_FISCAL de Facto = FOLIO_FACTURA de OPERA.</li>
                    <li><strong>Folio:</strong> FISCAL_BILL_FOLIO de Facto = FOLIO_OPERA de OPERA.</li>
                    <li><strong>Llave:</strong> ID ÚNICO de Facto = CONCAT de OPERA (confirmación + monto + fecha).</li>
                    <li><strong>Confirmación:</strong> RESERVA = CONFIRMACIÓN. Como en OPERA se puede repetir, se elige la fila con el mismo monto; si ninguna coincide se prueba con la suma de todas sus filas; si quedan varias sin cuadrar, se marca <em>Ambigua</em> para elegir a mano.</li>
                  </ol>
                  <p>Cada fila de OPERA se usa una sola vez. Se compara el TOTAL PAGADO de Facto (el del ID ÚNICO) contra los totales de OPERA, con la tolerancia indicada. Las facturas sin reserva de restaurantes y bares, los complementos de pago y las canceladas no se esperan en OPERA.</p>
                </div>
              ) : null}

              {panel === 'sheets' ? (
                <div className='conciliacion__panel'>
                  <ul className='conciliacion__sheets'>
                    {sheets.map((s) => {
                      const isOpera = sheetHas(s.rows, OPERA_REQUIRED)
                      const isFacto = sheetHas(s.rows, FACTO_REQUIRED)
                      const filled = s.rows.filter((r) => r && r.some((c) => c != null && String(c).trim() !== '')).length
                      return (
                        <li key={s.name}>
                          <strong>{s.name}</strong>
                          <span>{filled.toLocaleString('es-MX')} filas con datos</span>
                          {isOpera ? <span className='conciliacion__pill conciliacion__pill--ok'>Columnas de OPERA</span> : null}
                          {isFacto ? <span className='conciliacion__pill conciliacion__pill--ok'>Columnas de Facto</span> : null}
                          {!isOpera && !isFacto ? <span className='conciliacion__pill conciliacion__pill--danger'>No reconocida</span> : null}
                          {!isOpera && !isFacto ? <small>{describeHeaders(s.rows)}</small> : null}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div className='conciliacion__empty-drop'>
              <span className='conciliacion__drop-icon'><Icon name={loading ? 'progress_activity' : 'upload_file'} className={loading ? 'conciliacion__spin' : ''} /></span>
              <strong>Arrastra aquí el Excel (.xlsx) o haz clic para elegirlo</strong>
              <small>También puedes subir dos archivos, uno de OPERA y uno de Facto (.xlsx o CSV), juntos o uno después del otro.</small>
            </div>
          )}
        </section>

        {loadError ? <div className='conciliacion__alert conciliacion__alert--danger' role='alert'><Icon name='error' />{loadError}</div> : null}

        {sheets.length && !data && !analysis?.error ? (
          <div className='conciliacion__alert conciliacion__alert--warn'>
            <Icon name='info' />
            {!operaSheet && !factoSheet
              ? 'No reconocimos las hojas. Elige cuál es OPERA y cuál es Facto.'
              : missingOpera
                ? 'Ya está Facto. Falta OPERA FACTURADO: un CSV solo guarda una hoja, así que sube el Excel completo (.xlsx) o también el CSV de OPERA FACTURADO; se agrega sin perder lo que ya subiste.'
                : 'Ya está OPERA. Falta Facto: arrastra el archivo y se agrega sin perder lo que subiste.'}
          </div>
        ) : null}
        {analysis?.error ? <div className='conciliacion__alert conciliacion__alert--danger' role='alert'><Icon name='error' />{analysis.error}</div> : null}
        {data?.warnings.map((w, i) => (
          <div key={i} className='conciliacion__alert conciliacion__alert--warn'><Icon name='warning' />{w}</div>
        ))}

        {data ? (
          <Results
            data={data}
            tolerance={tolerance}
            adjustments={adjustments}
            user={userName}
            onSaveAdjustment={saveAdjustment}
            onRemoveAdjustment={removeAdjustment}
          />
        ) : null}
      </div>
    </div>
  )
}

export default Conciliacion
