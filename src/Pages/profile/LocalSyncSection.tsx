import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Swal from 'sweetalert2'
import { toast } from 'sonner'
import APIs from '../../services/APIs'
import './LocalSyncSection.css'

const when = (v?: string | null) => (v ? new Date(v).toLocaleString('es-MX') : '—')

/**
 * Sincronización con instalaciones locales.
 *  - En la NUBE: el dueño genera claves de enlace (una por local) y puede revocarlas.
 *  - En un LOCAL (LOCAL_INSTANCE=true en su .env): pega la clave de la nube y copia todos los datos.
 * Solo la ven dueños y administradores.
 */
const LocalSyncSection: React.FC<{ roleLevel?: number; userKind?: string; companies?: any[] }> = ({ roleLevel, userKind, companies = [] }) => {
  const [status, setStatus] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [newToken, setNewToken] = useState<{ name: string; token: string } | null>(null)
  const [cloudUrl, setCloudUrl] = useState('')
  const [token, setToken] = useState('')
  const [mode, setMode] = useState<'replace' | 'merge'>('replace')
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Dueño de la cuenta (cliente / ACCOUNT), plataforma (SYSTEM) o rol de nivel 2 o menor
  const allowed = roleLevel == null || roleLevel <= 2 || userKind === 'ACCOUNT' || userKind === 'SYSTEM'
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  // Alcance de la clave nueva: toda la cuenta o solo algunas sucursales
  const [scopeAll, setScopeAll] = useState(true)
  const [pickedBranches, setPickedBranches] = useState<number[]>([])

  // Escape cierra la ayuda
  useEffect(() => {
    if (!showHelp) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowHelp(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHelp])

  const load = useCallback(async () => {
    try {
      const res: any = await APIs.getLocalSyncStatus()
      setStatus(res?.data ?? null)
      setLoadError(null)
      if (res?.data && !res.data.isLocal) {
        try {
          const l: any = await APIs.listLocalSyncLinks()
          setLinks(Array.isArray(l?.data) ? l.data : [])
        } catch (e: any) {
          // La sección se muestra igual; la lista suele fallar si la base aún no tiene las tablas de sincronización
          setLoadError(e?.message || 'No se pudieron cargar las claves.')
        }
      }
    } catch (e: any) {
      setStatus(null)
      setLoadError(e?.message || 'No se pudo consultar la sincronización.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (allowed) load() }, [allowed, load])

  // Mientras la copia corre, se refresca el avance
  const running = status?.progress?.running || status?.lastPullStatus === 'RUNNING'
  useEffect(() => {
    if (!running) { if (timer.current) clearInterval(timer.current); timer.current = null; return }
    timer.current = setInterval(load, 1500)
    return () => { if (timer.current) clearInterval(timer.current); timer.current = null }
  }, [running, load])

  if (!allowed || loading) return null
  if (!status) {
    return (
      <section className='lsync'>
        <header className='lsync__head'>
          <span className='lsync__icon'><span className='material-symbols-rounded'>sync_problem</span></span>
          <div className='lsync__titles'>
            <h2>Sincronización local</h2>
            <p>No se pudo consultar el estado de la sincronización.</p>
          </div>
        </header>
        <div className='lsync__alert is-error'>
          <span className='material-symbols-rounded'>error</span>
          <div>
            <strong>{loadError || 'Sin respuesta del servidor'}</strong>
            <span>Reinicia el backend y corre «DB Push forzado» para crear las tablas de sincronización; luego reintenta.</span>
          </div>
        </div>
        <button type='button' className='lsync__btn lsync__btn--primary' onClick={load}>
          <span className='material-symbols-rounded'>refresh</span> Reintentar
        </button>
      </section>
    )
  }

  const branchName = (id: number) => companies.flatMap((c) => c?.branches ?? []).find((b: any) => b.id === id)?.name ?? `Sucursal ${id}`
  const scopeText = (ids?: number[]) => (!ids || ids.length === 0 ? 'Copia: toda la cuenta' : `Copia: ${ids.map(branchName).join(', ')}`)

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Clave copiada') } catch { toast.error('No se pudo copiar, selecciónala y cópiala a mano') }
  }

  // ── NUBE ──
  const generate = async () => {
    if (!name.trim()) { toast.warning('Ponle un nombre a la clave, por ejemplo "Sucursal Centro"'); return }
    try {
      setBusy(true)
      if (!scopeAll && pickedBranches.length === 0) { toast.warning('Elige al menos una sucursal o selecciona «Toda la cuenta»'); setBusy(false); return }
      const res: any = await APIs.createLocalSyncLink(name.trim(), scopeAll ? [] : pickedBranches)
      setNewToken({ name: res.data.name, token: res.data.token })
      setName('')
      setScopeAll(true)
      setPickedBranches([])
      load()
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo generar la clave')
    } finally { setBusy(false) }
  }

  const revoke = async (l: any) => {
    const r = await Swal.fire({ icon: 'warning', title: `¿Revocar "${l.name}"?`, text: 'Ese local ya no podrá sincronizar con la nube.', showCancelButton: true, confirmButtonText: 'Revocar', cancelButtonText: 'Cancelar' })
    if (!r.isConfirmed) return
    try { await APIs.revokeLocalSyncLink(l.id); load() } catch (e: any) { toast.error(e?.message || 'No se pudo revocar') }
  }

  // ── LOCAL ──
  const confirmReplace = async () => {
    if (mode !== 'replace') return true
    const r = await Swal.fire({
      icon: 'warning',
      title: 'Reemplazar los datos de este local',
      html: 'Se borrarán los datos que tenga este local, <b>incluidos sus usuarios</b>, y se copiará todo lo de la nube.<br>Después inicia sesión con tu cuenta de la nube.',
      showCancelButton: true, confirmButtonText: 'Sí, reemplazar', cancelButtonText: 'Cancelar',
    })
    return r.isConfirmed
  }

  const link = async () => {
    if (!cloudUrl.trim() || !token.trim()) { toast.warning('Escribe la dirección de la nube y pega la clave'); return }
    if (!(await confirmReplace())) return
    try {
      setBusy(true)
      const res: any = await APIs.linkLocalSync({ cloudUrl: cloudUrl.trim(), token: token.trim(), mode })
      toast.success(res?.message || 'Local enlazado')
      setToken('')
      load()
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo enlazar')
    } finally { setBusy(false) }
  }

  const pull = async () => {
    if (!(await confirmReplace())) return
    try { setBusy(true); await APIs.pullLocalSync(mode); toast.success('Sincronización iniciada'); load() } catch (e: any) { toast.error(e?.message || 'No se pudo sincronizar') } finally { setBusy(false) }
  }

  const unlink = async () => {
    const r = await Swal.fire({ icon: 'warning', title: '¿Desvincular este local?', text: 'Los datos copiados se conservan, pero ya no podrás sincronizar hasta volver a enlazarlo.', showCancelButton: true, confirmButtonText: 'Desvincular', cancelButtonText: 'Cancelar' })
    if (!r.isConfirmed) return
    try { await APIs.unlinkLocalSync(); load() } catch (e: any) { toast.error(e?.message || 'No se pudo desvincular') }
  }

  const p = status.progress ?? {}
  const pct = p.modelsTotal ? Math.round(((p.modelIndex ?? 0) / p.modelsTotal) * 100) : 0
  const lastStatus = status.lastPullStatus

  return (
    <section className='lsync'>
      {/* ───────── Encabezado ───────── */}
      <header className='lsync__head'>
        <span className='lsync__icon'><span className='material-symbols-rounded'>{status.isLocal ? 'dns' : 'cloud_sync'}</span></span>
        <div className='lsync__titles'>
          <h2>Sincronización local</h2>
          <p>{status.isLocal ? 'Vincula este servidor con tu cuenta en la nube' : 'Conecta tus servidores locales con esta cuenta'}</p>
        </div>
        <span className={`lsync__badge ${status.isLocal ? 'is-local' : 'is-cloud'}`}>
          <span className='material-symbols-rounded'>{status.isLocal ? 'storage' : 'cloud'}</span>
          {status.isLocal ? 'Instalación local' : 'Nube'}
        </span>
        <button type='button' className='lsync__help' title='¿Cómo funciona?' aria-label='¿Cómo funciona?' onClick={() => setShowHelp(true)}>
          <span className='material-symbols-rounded'>help</span>
        </button>
      </header>

      {/* ───────── NUBE: generar y administrar claves ───────── */}
      {!status.isLocal && (
        <>
          {loadError && (
            <div className='lsync__alert is-error'>
              <span className='material-symbols-rounded'>error</span>
              <div><strong>{loadError}</strong><span>Corre «DB Push forzado» si es la primera vez.</span></div>
            </div>
          )}

          {newToken && (
            <div className='lsync__reveal' role='status'>
              <div className='lsync__reveal-top'>
                <span className='material-symbols-rounded'>key</span>
                <div>
                  <strong>Clave lista para «{newToken.name}»</strong>
                  <span>Cópiala ahora: por seguridad no se vuelve a mostrar. Trátala como una contraseña.</span>
                </div>
              </div>
              <code className='lsync__token'>{newToken.token}</code>
              <div className='lsync__reveal-actions'>
                <button type='button' className='lsync__btn lsync__btn--primary' onClick={() => copy(newToken.token)}>
                  <span className='material-symbols-rounded'>content_copy</span> Copiar clave
                </button>
                <button type='button' className='lsync__btn lsync__btn--ghost' onClick={() => setNewToken(null)}>Ya la guardé</button>
              </div>
            </div>
          )}

          <div className='lsync__card'>
            <h3 className='lsync__card-title'><span className='material-symbols-rounded'>add_link</span> Nueva clave de enlace</h3>

            <label className='lsync__field'>
              <span>Nombre del local</span>
              <input className='lsync__input' placeholder='Ej. Sucursal Centro' value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
            </label>

            <div className='lsync__field'>
              <span>¿Qué datos copia este local?</span>
              <div className='lsync__options'>
                <button type='button' className={`lsync__option ${scopeAll ? 'is-on' : ''}`} onClick={() => setScopeAll(true)} aria-pressed={scopeAll}>
                  <span className='material-symbols-rounded'>domain</span>
                  <strong>Toda la cuenta</strong>
                  <small>Todas las empresas y sucursales</small>
                </button>
                <button type='button' className={`lsync__option ${!scopeAll ? 'is-on' : ''}`} onClick={() => setScopeAll(false)} aria-pressed={!scopeAll}>
                  <span className='material-symbols-rounded'>storefront</span>
                  <strong>Solo algunas sucursales</strong>
                  <small>Elige cuáles se copian</small>
                </button>
              </div>
            </div>

            {!scopeAll && (
              <div className='lsync__branches'>
                {companies.filter((c) => c?.branches?.length).map((c) => (
                  <div key={c.id} className='lsync__company'>
                    <span className='lsync__company-name'>{c.name}</span>
                    <div className='lsync__chips'>
                      {c.branches.map((b: any) => {
                        const on = pickedBranches.includes(b.id)
                        return (
                          <label key={b.id} className={`lsync__chip ${on ? 'is-on' : ''}`}>
                            <input type='checkbox' checked={on} onChange={(e) => setPickedBranches(e.target.checked ? [...pickedBranches, b.id] : pickedBranches.filter((x) => x !== b.id))} />
                            <span className='material-symbols-rounded'>{on ? 'check_circle' : 'add_circle'}</span>
                            {b.name}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <p className='lsync__note'>
                  <span className='material-symbols-rounded'>info</span>
                  Siempre viaja la estructura de la empresa (sucursales, almacenes, usuarios y catálogos). De las sucursales elegidas se copian además ventas, inventario, caja, series y disponibilidad.
                </p>
              </div>
            )}

            <button type='button' className='lsync__btn lsync__btn--primary lsync__btn--block' onClick={generate} disabled={busy}>
              <span className='material-symbols-rounded'>vpn_key</span> {busy ? 'Generando…' : 'Generar clave'}
            </button>
          </div>

          <h3 className='lsync__subtitle'>Claves generadas {links.length > 0 && <span className='lsync__count'>{links.length}</span>}</h3>
          {links.length === 0 ? (
            <div className='lsync__empty'>
              <span className='material-symbols-rounded'>key_off</span>
              <strong>Aún no has generado claves</strong>
              <span>Genera una para vincular tu primer local.</span>
            </div>
          ) : (
            <div className='lsync__list'>
              {links.map((l) => (
                <article className={`lsync__item ${l.status !== 'ACTIVE' ? 'is-off' : ''}`} key={l.id}>
                  <span className='lsync__item-icon'><span className='material-symbols-rounded'>dns</span></span>
                  <div className='lsync__item-main'>
                    <div className='lsync__item-top'>
                      <strong>{l.name}</strong>
                      <span className={`lsync__status ${l.status === 'ACTIVE' ? 'is-ok' : 'is-off'}`}>{l.status === 'ACTIVE' ? 'Activa' : 'Revocada'}</span>
                    </div>
                    <div className='lsync__item-meta'>
                      <span><span className='material-symbols-rounded'>vpn_key</span>····{l.tokenHint}</span>
                      <span><span className='material-symbols-rounded'>storefront</span>{scopeText(l.branchIds)}</span>
                      <span><span className='material-symbols-rounded'>event</span>Creada {when(l.createdAt)}</span>
                      <span><span className='material-symbols-rounded'>wifi_tethering</span>{l.lastSeenAt ? `Última conexión ${when(l.lastSeenAt)}` : 'Aún no se conecta'}</span>
                    </div>
                  </div>
                  {l.status === 'ACTIVE' && (
                    <button type='button' className='lsync__btn lsync__btn--danger' onClick={() => revoke(l)}>
                      <span className='material-symbols-rounded'>block</span> Revocar
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ───────── LOCAL: vincular y copiar ───────── */}
      {status.isLocal && !status.linked && (
        <div className='lsync__card'>
          <h3 className='lsync__card-title'><span className='material-symbols-rounded'>link</span> Vincular con la nube</h3>
          <div className='lsync__grid2'>
            <label className='lsync__field'>
              <span>Dirección de la nube</span>
              <input className='lsync__input' placeholder='https://erp.tudominio.com' value={cloudUrl} onChange={(e) => setCloudUrl(e.target.value)} disabled={busy} />
            </label>
            <label className='lsync__field'>
              <span>Clave de sincronización</span>
              <input className='lsync__input' type='password' autoComplete='off' placeholder='fxs_…' value={token} onChange={(e) => setToken(e.target.value)} disabled={busy} />
            </label>
          </div>

          <div className='lsync__field'>
            <span>¿Cómo se copian los datos?</span>
            <div className='lsync__options'>
              <button type='button' className={`lsync__option ${mode === 'replace' ? 'is-on' : ''}`} onClick={() => setMode('replace')} aria-pressed={mode === 'replace'}>
                <span className='material-symbols-rounded'>cloud_download</span>
                <strong>Reemplazar</strong>
                <small>Vacía este local y copia todo. Recomendado la primera vez.</small>
              </button>
              <button type='button' className={`lsync__option ${mode === 'merge' ? 'is-on' : ''}`} onClick={() => setMode('merge')} aria-pressed={mode === 'merge'}>
                <span className='material-symbols-rounded'>merge</span>
                <strong>Combinar</strong>
                <small>Conserva lo local y solo agrega lo que falta.</small>
              </button>
            </div>
          </div>

          <button type='button' className='lsync__btn lsync__btn--primary lsync__btn--block' onClick={link} disabled={busy}>
            <span className='material-symbols-rounded'>sync</span> {busy ? 'Vinculando…' : 'Vincular y copiar datos'}
          </button>
        </div>
      )}

      {status.isLocal && status.linked && (
        <>
          <div className='lsync__card lsync__linked'>
            <div className='lsync__linked-top'>
              <span className='lsync__item-icon'><span className='material-symbols-rounded'>cloud_done</span></span>
              <div>
                <strong>{status.cloudName || 'Nube vinculada'}</strong>
                <span>{status.cloudUrl}</span>
              </div>
              <span className={`lsync__status ${lastStatus === 'OK' ? 'is-ok' : lastStatus === 'ERROR' ? 'is-off' : 'is-run'}`}>
                {lastStatus === 'OK' ? 'Al día' : lastStatus === 'ERROR' ? 'Con error' : lastStatus === 'RUNNING' ? 'Sincronizando' : 'Sin sincronizar'}
              </span>
            </div>
            <div className='lsync__facts'>
              <div><span className='material-symbols-rounded'>storefront</span><small>Copia</small><strong>{status.scopeLabel || 'Toda la cuenta'}</strong></div>
              <div><span className='material-symbols-rounded'>link</span><small>Vinculado</small><strong>{when(status.linkedAt)}</strong></div>
              <div><span className='material-symbols-rounded'>history</span><small>Última sincronización</small><strong>{when(status.lastPullAt)}</strong></div>
              <div><span className='material-symbols-rounded'>table_rows</span><small>Filas copiadas</small><strong>{status.lastPullRows ?? '—'}</strong></div>
            </div>

            {running && (
              <div className='lsync__progress' role='status'>
                <div className='lsync__progress-top'>
                  <span>Copiando <strong>{p.model ?? '…'}</strong> ({p.modelIndex ?? 0}/{p.modelsTotal ?? '?'})</span>
                  <strong>{pct}%</strong>
                </div>
                <div className='lsync__bar'><span style={{ width: `${pct}%` }} /></div>
                <small>{p.rows ?? 0} filas copiadas</small>
              </div>
            )}
            {!running && (lastStatus === 'ERROR' || p.error) && (
              <div className='lsync__alert is-error'>
                <span className='material-symbols-rounded'>error</span>
                <div><strong>La última sincronización falló</strong><span>{status.lastPullError || p.error}</span></div>
              </div>
            )}
          </div>

          <div className='lsync__card'>
            <h3 className='lsync__card-title'><span className='material-symbols-rounded'>sync</span> Sincronizar ahora</h3>
            <div className='lsync__options'>
              <button type='button' className={`lsync__option ${mode === 'replace' ? 'is-on' : ''}`} onClick={() => setMode('replace')} aria-pressed={mode === 'replace'}>
                <span className='material-symbols-rounded'>cloud_download</span>
                <strong>Reemplazar</strong>
                <small>Vacía este local y copia todo de nuevo.</small>
              </button>
              <button type='button' className={`lsync__option ${mode === 'merge' ? 'is-on' : ''}`} onClick={() => setMode('merge')} aria-pressed={mode === 'merge'}>
                <span className='material-symbols-rounded'>merge</span>
                <strong>Combinar</strong>
                <small>Solo agrega lo que falte.</small>
              </button>
            </div>
            <div className='lsync__actions'>
              <button type='button' className='lsync__btn lsync__btn--primary' onClick={pull} disabled={busy || running}>
                <span className='material-symbols-rounded'>sync</span> Sincronizar ahora
              </button>
              <button type='button' className='lsync__btn lsync__btn--danger' onClick={unlink} disabled={busy || running}>
                <span className='material-symbols-rounded'>link_off</span> Desvincular
              </button>
            </div>
          </div>
        </>
      )}

      {showHelp && createPortal(
        <div className='profile-sync-modal__overlay' onClick={() => setShowHelp(false)}>
          <div className='profile-sync-modal__popup' role='dialog' aria-modal='true' aria-label='Cómo funciona la sincronización local' onClick={(e) => e.stopPropagation()}>
            <div className='profile-sync-modal__header'>
              <h3>¿Cómo funciona la sincronización local?</h3>
              <button type='button' className='profile-sync-modal__close' onClick={() => setShowHelp(false)} aria-label='Cerrar'>✕</button>
            </div>
            <div className='profile-sync-modal__body'>
              <p className='profile-sync-modal__intro'>
                Copia todos los datos de tu cuenta en la nube a una instalación <strong>local</strong> (un servidor en tu negocio).
                La nube genera una clave por cada local y el local la usa para vincularse.
              </p>

              <h4>Pasos</h4>
              <ol className='profile-sync-modal__steps'>
                <li>
                  <span className='n'>1</span>
                  <div><strong>En la nube, genera una clave</strong><p>Elige si el local copia <strong>toda la cuenta</strong> o <strong>solo algunas sucursales</strong>, y ponle un nombre para reconocerla. Se muestra una sola vez: cópiala.</p></div>
                </li>
                <li>
                  <span className='n'>2</span>
                  <div>
                    <strong>Configura el servidor local</strong>
                    <p>Define estas variables en el <code>.env</code> del backend local:</p>
                    <pre>{`IS_MASTER=false\nLOCAL_INSTANCE=true\nSYNC_SECRET=<un-texto-largo-propio>`}</pre>
                  </div>
                </li>
                <li>
                  <span className='n'>3</span>
                  <div><strong>Crea la base local</strong><p>Ejecuta <code>prisma db push</code> para crear el esquema y abre el ERP local.</p></div>
                </li>
                <li>
                  <span className='n'>4</span>
                  <div><strong>Vincula el local</strong><p>En su Perfil aparece «Instalación local»: pega la dirección de la nube y la clave, y elige <em>Vincular y copiar datos</em>.</p></div>
                </li>
                <li>
                  <span className='n'>5</span>
                  <div><strong>Mantenlo al día</strong><p>Usa <em>Sincronizar ahora</em> cuando quieras volver a copiar los cambios de la nube.</p></div>
                </li>
              </ol>

              <div className='profile-sync-modal__grid'>
                <div className='profile-sync-modal__card'>
                  <h4>Modos de copia</h4>
                  <ul>
                    <li><strong>Reemplazar:</strong> vacía el local, incluidos sus usuarios, y copia todo. Recomendado la primera vez; después se entra con la cuenta de la nube.</li>
                    <li><strong>Combinar:</strong> no borra nada; solo agrega lo que falte.</li>
                  </ul>
                </div>
                <div className='profile-sync-modal__card'>
                  <h4>Seguridad</h4>
                  <ul>
                    <li>Cada clave se puede <strong>revocar</strong> y ese local deja de sincronizar.</li>
                    <li>Trata la clave como una contraseña y usa HTTPS entre el local y la nube.</li>
                    <li>Las credenciales de bases de la nube nunca viajan al local.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className='profile-sync-modal__actions'>
              <button type='button' className='profile__add-btn' onClick={() => setShowHelp(false)}>Entendido</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}

export default LocalSyncSection
