import React, { useCallback, useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import '../../categories/Categories.css'
import '../production.css'
import CategoriesStorePicker from '../../categories/CategoriesStorePicker'
import APIs from '../../../../../services/APIs'
import { readCategoryBranchId } from '../../../../../constants/category'

const LS_COMPANY = 'categories-picker-company-id'

const readCompanyId = (): number | null => {
  const id = Number(localStorage.getItem(LS_COMPANY))
  return !Number.isNaN(id) && id > 0 ? id : null
}

const ProductionAreas: React.FC = () => {
  const [branchId, setBranchId] = useState(() => readCategoryBranchId())
  const [areas, setAreas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const persistBranchId = useCallback((id: number) => {
    setBranchId(id)
    localStorage.setItem('categories-store-id', String(id))
  }, [])

  const fetchAreas = useCallback(async () => {
    const companyId = readCompanyId()
    if (!companyId) {
      setAreas([])
      return
    }

    setLoading(true)
    try {
      const response: any = await APIs.getAreas({
        companyId,
        branchId: branchId > 0 ? branchId : undefined,
        production: true,
      })
      setAreas(Array.isArray(response?.data) ? response.data : [])
    } catch (error) {
      console.error(error)
      setAreas([])
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const companyId = readCompanyId()
    if (!companyId) {
      Swal.fire({ icon: 'warning', title: 'Empresa requerida', text: 'Selecciona una empresa.' })
      return
    }
    if (!branchId || branchId <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal requerida',
        text: 'Selecciona una sucursal para registrar el área.',
      })
      return
    }
    if (!name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nombre requerido', text: 'Escribe el nombre del área.' })
      return
    }

    setSaving(true)
    try {
      await APIs.createAreas({
        companyId,
        branchId,
        name: name.trim(),
        production: true,
      })
      setName('')
      Swal.fire({ icon: 'success', title: 'Área creada', timer: 1500, showConfirmButton: false })
      fetchAreas()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message ?? 'No se pudo crear el área.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (area: any) => {
    const result = await Swal.fire({
      title: '¿Eliminar área?',
      text: `Se eliminará "${area.name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return

    try {
      await APIs.deleteArea(area.id)
      Swal.fire({ icon: 'success', title: 'Área eliminada', timer: 1200, showConfirmButton: false })
      fetchAreas()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message ?? 'No se pudo eliminar el área.',
      })
    }
  }

  return (
    <div className='production'>
      <div className='production__container'>
        <header className='production__header'>
          <span className='production__eyebrow'>Producción</span>
          <h1 className='production__title'>Áreas de producción</h1>
          <p className='production__subtitle'>
            Define las áreas destino (corte, confección, bordado, etc.) para enviar órdenes y
            reasignarlas cuando cambien de proceso.
          </p>
        </header>

        <div className='production__toolbar'>
          <div className='production__toolbar-left'>
            <CategoriesStorePicker
              branchId={branchId}
              onBranchIdChange={persistBranchId}
              onCompanyIdChange={() => fetchAreas()}
            />
          </div>
        </div>

        <form className='production-areas__form' onSubmit={handleCreate}>
          <div className='production-areas__form-field'>
            <label htmlFor='area-name'>Nueva área</label>
            <input
              id='area-name'
              className='inputs__general'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ej. Corte, Confección, Empaque…'
            />
          </div>
          <button type='submit' className='btn__general-purple' disabled={saving}>
            {saving ? 'Guardando…' : 'Agregar área'}
          </button>
        </form>

        <section className='production__table-wrap'>
          <div className='production__table-head production-areas__head'>
            <span>Área</span>
            <span>Sucursal</span>
            <span>Tipo</span>
            <span>Acciones</span>
          </div>
          <div className='production__table-body'>
            {loading ? (
              <div className='production__loading'>
                <span className='production__spinner' />
                Cargando áreas…
              </div>
            ) : areas.length === 0 ? (
              <p className='production__empty'>
                No hay áreas de producción. Crea la primera arriba.
              </p>
            ) : (
              areas.map((area) => (
                <div className='production__table-row production-areas__row' key={area.id}>
                  <span className='production-areas__name'>{area.name}</span>
                  <span>{area.branchName ?? area.branch?.name ?? '—'}</span>
                  <span>
                    <span className='production__status production__status--progress'>
                      Producción
                    </span>
                  </span>
                  <div className='production__actions'>
                    <button
                      type='button'
                      className='production__action-btn production__action-btn--delete'
                      onClick={() => handleDelete(area)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ProductionAreas
