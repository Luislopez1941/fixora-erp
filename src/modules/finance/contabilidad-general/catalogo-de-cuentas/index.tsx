import React, { useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { ACCOUNT_TYPES, AccPage, errorText, useAccountingCompany, useAccounts } from '../../shared/ui'

const emptyForm = { id: '', code: '', name: '', type: 'ASSET', parentId: '', isDetail: true, satCode: '', active: true }

/** Catálogo de cuentas: árbol por código, alta y edición (el código, el tipo y el padre no cambian una vez creada la cuenta). */
const CatalogoDeCuentas: React.FC = () => {
  const can = useCan()
  const canManage = can('accounting.manage')
  const { companies, companyId, setCompanyId } = useAccountingCompany()
  const { accounts, loading, reload } = useAccounts(companyId)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [form, setForm] = useState<typeof emptyForm | null>(null)
  const [saving, setSaving] = useState(false)

  const byId = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const depth = (account: any) => {
    let level = 0
    let current = account
    while (current?.parentId && byId.has(current.parentId) && level < 10) { level += 1; current = byId.get(current.parentId) }
    return level
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return accounts.filter((a) => (!type || a.type === type) && (!q || `${a.code} ${a.name}`.toLowerCase().includes(q)))
  }, [accounts, search, type])

  const parents = accounts.filter((a) => !a.isDetail && a.active)

  const save = async () => {
    if (!form) return
    if (!form.name.trim() || (!form.id && !form.code.trim())) return Swal.fire('Faltan datos', 'Escribe el código y el nombre de la cuenta.', 'warning')
    setSaving(true)
    try {
      if (form.id) {
        await APIs.updateAccount(form.id, { name: form.name.trim(), active: form.active, satCode: form.satCode.trim() || undefined })
      } else {
        await APIs.createAccount({
          companyId, code: form.code.trim(), name: form.name.trim(), type: form.type,
          ...(form.parentId ? { parentId: form.parentId } : {}), isDetail: form.isDetail, ...(form.satCode.trim() ? { satCode: form.satCode.trim() } : {}),
        })
      }
      setForm(null)
      reload()
    } catch (error) {
      Swal.fire('No se pudo guardar', errorText(error, 'Revisa los datos e intenta de nuevo.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccPage
      title='Catálogo de cuentas'
      subtitle='Plan de cuentas de la empresa. Las cuentas de detalle reciben movimientos; las demás agrupan.'
      companies={companies} companyId={companyId} onCompany={setCompanyId}
      filters={
        <>
          <div className='acc__field'><label>Buscar</label><input className='inputs__general' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Código o nombre' /></div>
          <div className='acc__field'>
            <label>Tipo</label>
            <select className='inputs__general' value={type} onChange={(e) => setType(e.target.value)}>
              <option value=''>Todos</option>
              {Object.entries(ACCOUNT_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </>
      }
      actions={canManage && <button type='button' className='acc__btn acc__btn--primary' onClick={() => setForm({ ...emptyForm })}><span className='material-symbols-rounded'>add</span>Nueva cuenta</button>}
    >
      {form && (
        <div className='acc__panel'>
          <h2>{form.id ? 'Editar cuenta' : 'Nueva cuenta'}</h2>
          <div className='acc__grid'>
            <div className='acc__field'><label>Código</label><input className='inputs__general' value={form.code} disabled={!!form.id} maxLength={30} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder='Ej. 1101-001' /></div>
            <div className='acc__field'><label>Nombre</label><input className='inputs__general' value={form.name} maxLength={200} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className='acc__field'>
              <label>Tipo</label>
              <select className='inputs__general' value={form.type} disabled={!!form.id} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(ACCOUNT_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className='acc__field'>
              <label>Cuenta padre</label>
              <select className='inputs__general' value={form.parentId} disabled={!!form.id} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value=''>Sin padre (cuenta de primer nivel)</option>
                {parents.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
              </select>
            </div>
            <div className='acc__field'><label>Código agrupador SAT</label><input className='inputs__general' value={form.satCode} maxLength={30} onChange={(e) => setForm({ ...form, satCode: e.target.value })} /></div>
            <div className='acc__field'>
              <label>Recibe movimientos</label>
              <select className='inputs__general' value={form.isDetail ? '1' : '0'} disabled={!!form.id} onChange={(e) => setForm({ ...form, isDetail: e.target.value === '1' })}>
                <option value='1'>Sí, es cuenta de detalle</option>
                <option value='0'>No, solo agrupa</option>
              </select>
            </div>
            {form.id && (
              <div className='acc__field'>
                <label>Estado</label>
                <select className='inputs__general' value={form.active ? '1' : '0'} onChange={(e) => setForm({ ...form, active: e.target.value === '1' })}>
                  <option value='1'>Activa</option><option value='0'>Inactiva</option>
                </select>
              </div>
            )}
          </div>
          <div className='acc__filters'>
            <button type='button' className='acc__btn acc__btn--primary' disabled={saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar'}</button>
            <button type='button' className='acc__btn' onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <div className='acc__loading'>Cargando cuentas…</div> : rows.length === 0 ? (
        <div className='acc__empty'>{accounts.length ? 'Ninguna cuenta coincide con el filtro.' : 'Todavía no hay cuentas. Crea la primera con “Nueva cuenta”.'}</div>
      ) : (
        <div className='acc__table-wrap'>
          <table className='acc__table'>
            <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Naturaleza</th><th>Movimientos</th><th>SAT</th><th /></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className={`${a.isDetail ? '' : 'is-group'} ${a.active ? '' : 'is-inactive'}`}>
                  <td>{a.code}</td>
                  <td><div className='acc__tree-name' style={{ paddingLeft: depth(a) * 18 }}>{!a.isDetail && <span className='material-symbols-rounded' style={{ fontSize: 18 }}>folder</span>}{a.name}</div></td>
                  <td>{ACCOUNT_TYPES[a.type] ?? a.type}</td>
                  <td className='is-muted'>{a.nature === 'DEBIT' ? 'Deudora' : 'Acreedora'}</td>
                  <td>{a.isDetail ? <span className='acc__badge acc__badge--ok'>Detalle</span> : <span className='acc__badge'>Agrupa</span>}</td>
                  <td className='is-muted'>{a.satCode ?? ''}</td>
                  <td>
                    {canManage && (
                      <div className='acc__row-actions'>
                        <button type='button' className='acc__btn acc__btn--sm' onClick={() => setForm({ id: a.id, code: a.code, name: a.name, type: a.type, parentId: a.parentId ?? '', isDetail: a.isDetail, satCode: a.satCode ?? '', active: a.active })}>
                          <span className='material-symbols-rounded'>edit</span>Editar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AccPage>
  )
}

export default CatalogoDeCuentas
