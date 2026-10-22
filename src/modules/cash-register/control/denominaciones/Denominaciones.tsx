import React, { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import APIs from '../../../../services/APIs'
import { useCan } from '../../../../core/permissions/useCan'
import { readCategoryBranchId } from '../../../../constants/category'
import { showToast } from '../../../../utils/toast'
import ControlPage from '../../shared/control-page/ControlPage'
import { errorText } from '../../shared/cashFormat'
import { denomLabel } from '../../shared/denominations'
import DenominationGroup, { DenominationItem } from './denomination-group/DenominationGroup'
import ModalDenomination from './modal-denomination/ModalDenomination'
import './Denominaciones.css'

/** Billetes y monedas que se cuentan en los arqueos de la empresa. */
const Denominaciones: React.FC = () => {
  const can = useCan()
  const canView = can('cash-register.control-denominaciones.view')
  const canManage = can('cash-register.control-denominaciones.manage')
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [data, setData] = useState<{ custom: boolean; items: DenominationItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    if (!(branchId > 0) || !canView) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res: any = await APIs.getCashDenominations(branchId)
      setData(res?.data ?? null)
    } catch (e) {
      setData(null)
      setError(errorText(e, 'No se pudieron cargar las denominaciones.'))
    } finally {
      setLoading(false)
    }
  }, [branchId, canView])

  useEffect(() => {
    load()
  }, [load])

  const run = async (key: string, fn: () => Promise<any>, ok: { title: string; text?: string }) => {
    setBusy(key)
    try {
      const res: any = await fn()
      setData(res?.data ?? null)
      showToast({ type: 'success', ...ok })
      return true
    } catch (e) {
      showToast({ type: 'error', title: 'No se pudo guardar', text: errorText(e, 'Intenta de nuevo.') })
      return false
    } finally {
      setBusy('')
    }
  }

  const toggle = (d: DenominationItem) =>
    run(`${d.kind}:${d.value}`, () => APIs.saveCashDenomination({ branchId, kind: d.kind, value: d.value, active: !d.active }), {
      title: d.active ? 'Denominación desactivada' : 'Denominación activada',
      text: `${d.kind === 'BILL' ? 'Billete' : 'Moneda'} de ${denomLabel(d.value)}`,
    })

  const remove = async (d: DenominationItem) => {
    const ok = await Swal.fire({
      title: '¿Eliminar la denominación?',
      html: `${d.kind === 'BILL' ? 'El billete' : 'La moneda'} de <b>${denomLabel(d.value)}</b> ya no aparecerá en los arqueos. Los arqueos anteriores no cambian.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d64545',
    })
    if (!ok.isConfirmed) return
    run(`${d.kind}:${d.value}`, () => APIs.deleteCashDenomination(branchId, d.kind, d.value), { title: 'Denominación eliminada', text: denomLabel(d.value) })
  }

  const reset = async () => {
    const ok = await Swal.fire({
      title: '¿Volver a las de MXN?',
      text: 'Se borran tus cambios y se usan los billetes de $20 a $1,000 y las monedas de 50¢ a $20.',
      showCancelButton: true,
      confirmButtonText: 'Restablecer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#072a57',
    })
    if (ok.isConfirmed) run('reset', () => APIs.resetCashDenominations(branchId), { title: 'Denominaciones restablecidas' })
  }

  const items = data?.items ?? []
  return (
    <ControlPage
      title='Denominaciones'
      subtitle='Los billetes y monedas que aparecen al hacer un arqueo. Aplican a toda la empresa.'
      canView={canView}
      branchId={branchId}
      onBranchChange={setBranchId}
      loading={loading || !data}
      error={error}
      onRetry={load}
      actions={
        canManage && data ? (
          <>
            {data.custom ? (
              <button type='button' className='btn__general-secondary' onClick={reset} disabled={!!busy}>
                <span className='material-symbols-rounded'>restart_alt</span> Volver a las de MXN
              </button>
            ) : null}
            <button type='button' className='btn__general-purple' onClick={() => setAdding(true)} disabled={!!busy}>
              <span className='material-symbols-rounded'>add</span> Agregar
            </button>
          </>
        ) : null
      }
    >
      {data ? (
        <>
          {!data.custom ? (
            <p className='denominaciones__banner control-page__full'>
              <span className='material-symbols-rounded' aria-hidden>info</span>
              Se usan las denominaciones predeterminadas de MXN. Al primer cambio se copian a tu empresa para que las ajustes.
            </p>
          ) : null}
          <DenominationGroup title='Billetes' icon='payments' items={items.filter((d) => d.kind === 'BILL')} canManage={canManage} busy={busy} onToggle={toggle} onRemove={remove} />
          <DenominationGroup title='Monedas' icon='toll' items={items.filter((d) => d.kind === 'COIN')} canManage={canManage} busy={busy} onToggle={toggle} onRemove={remove} />
        </>
      ) : null}
      {adding ? (
        <ModalDenomination
          existing={items}
          onClose={() => setAdding(false)}
          onSave={async (d) => {
            const ok = await run('add', () => APIs.saveCashDenomination({ branchId, ...d, active: true }), {
              title: 'Denominación agregada',
              text: `${d.kind === 'BILL' ? 'Billete' : 'Moneda'} de ${denomLabel(d.value)}`,
            })
            if (ok) setAdding(false)
          }}
        />
      ) : null}
    </ControlPage>
  )
}

export default Denominaciones
