import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import APIs from '../../services/APIs'
import { toast } from 'sonner'
import CreateBranchModal from './CreateBranchModal'
import CreateCompanyModal from './CreateCompanyModal'
import EditCompanyModal from './EditCompanyModal'
import EditBranchModal from './EditBranchModal'
import TableSkeleton from '../../components/general/skeleton/TableSkeleton'
import LocalSyncSection from './LocalSyncSection'
import './Profile.css'

const Profile: React.FC = () => {
  const userFromRedux = useSelector((state: any) => state.user)
  const [user, setUser] = useState<any>(userFromRedux)
  const [loading, setLoading] = useState(true)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false)
  const [showEditBranchModal, setShowEditBranchModal] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [selectedBranch, setSelectedBranch] = useState<any>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const userId = userFromRedux?.id || userFromRedux?._id
        
        if (!userId) {
          toast.error('No se encontró el ID del usuario')
          setLoading(false)
          return
        }

        const response: any = await APIs.getUserById(userId)
        
        if (response?.status === 'success' && response?.data) {
          setUser(response.data)
        } else {
          toast.warning('No se pudo cargar la información completa del usuario')
          setUser(userFromRedux)
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error)
        toast.error('Error al cargar la información del usuario')
        setUser(userFromRedux)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userFromRedux])

  const handleRefreshUser = async () => {
    try {
      const userId = userFromRedux?.id || userFromRedux?._id
      if (!userId) return

      const response: any = await APIs.getUserById(userId)
      if (response?.status === 'success' && response?.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Error al recargar usuario:', error)
    }
  }

  if (loading) {
    // Mismo skeleton con brillo que usan las tablas (Caja > Movimientos), con la forma de esta página
    const line = (w: string, h = 12) => <span className='table-skeleton__shimmer profile__sk-line' style={{ width: w, height: h }} />
    return (
      <div className='profile' role='status' aria-label='Cargando perfil'>
        <div className='profile__container'>
          <div className='profile__header profile__sk-header' aria-hidden>
            <span className='table-skeleton__shimmer profile__sk-avatar' />
            <div className='profile__sk-stack'>{line('180px', 16)}{line('90px')}</div>
          </div>
          <div className='profile__sections'>
            {[0, 1].map((n) => (
              <div className='profile__section' key={n} aria-hidden>
                {line('150px', 14)}
                <div className='profile__sk-grid'>
                  {[0, 1, 2, 3].map((k) => (
                    <div className='profile__sk-stack' key={k}>{line('70px', 10)}{line('100%', 34)}</div>
                  ))}
                </div>
              </div>
            ))}
            <div className='profile__section--companies' style={{ gridColumn: '1 / -1' }} aria-hidden>
              <div className='pco__header'>{line('190px', 16)}{line('130px', 36)}</div>
              <div className='pco__list'>
                <div className='pco__row pco__row--head'>{line('120px', 10)}{line('60px', 10)}{line('60px', 10)}</div>
                <TableSkeleton rowClassName='pco__row' rows={4} cols={[{ avatar: true, width: '55%' }, { pill: true, width: '80px' }, { actions: 2 }]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='profile'>
      <div className='profile__container'>
        <div className='profile__header'>
          <div className='profile__avatar'>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
              <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
            </svg>
          </div>
          <h1 className='profile__name'>{user.name || 'Usuario'}</h1>
          <p className='profile__role'>{user.role?.name || user.userKind || 'Usuario'}</p>
        </div>

        <div className='profile__sections'>
          {/* Información Personal */}
          <div className='profile__section profile__section--personal'>
            <h2 className='profile__section-title'>Información Personal</h2>
            <div className='profile__grid'>
              <div className='profile__field'>
                <label className='profile__label'>Nombre</label>
                <div className='profile__value'>{user.firstName || '-'}</div>
              </div>
              <div className='profile__field'>
                <label className='profile__label'>Apellido</label>
                <div className='profile__value'>{user.firstLastName || '-'}</div>
              </div>
              <div className='profile__field'>
                <label className='profile__label'>Correo Electrónico</label>
                <div className='profile__value'>{user.email || '-'}</div>
              </div>
              <div className='profile__field'>
                <label className='profile__label'>Tipo de Usuario</label>
                <div className='profile__value'>{user.userKind || '-'}</div>
              </div>
            </div>
          </div>

          {/* Sincronización con instalaciones locales (solo dueño / administradores) */}
          <LocalSyncSection roleLevel={user.role?.level} userKind={user.userKind} companies={(user.userCompanies ?? []).map((uc: any) => uc.company).filter(Boolean)} />

          {/* Empresas y Sucursales */}
          <div className='profile__section profile__section--companies'>
            <div className='pco__header'>
              <h2 className='profile__section-title'>Empresas y Sucursales</h2>
              <button className='btn__general-primary pco__new' onClick={() => setShowCompanyModal(true)} type='button'>
                <span className='material-symbols-rounded'>add</span>
                Nueva empresa
              </button>
            </div>

            {user.userCompanies && user.userCompanies.length > 0 ? (
              <div className='pco__list'>
                <div className='pco__row pco__row--head'>
                  <span>Empresa / Sucursal</span>
                  <span>Detalle</span>
                  <span className='pco__col-actions'>Acciones</span>
                </div>

                {user.userCompanies.map((uc: any, index: number) => {
                  const company = uc.company
                  const branches: any[] = company?.branches ?? []
                  return (
                    <div className='pco__group' key={company?.id ?? index}>
                      <div className='pco__row pco__row--company'>
                        <div className='pco__cell pco__cell--name'>
                          <span className='pco__icon'><span className='material-symbols-rounded'>apartment</span></span>
                          <div>
                            <strong>{company?.name || 'Sin nombre'}</strong>
                            {company?.businessName && <small>{company.businessName}</small>}
                          </div>
                        </div>
                        <div className='pco__cell'>
                          <span className='pco__tag'>{branches.length} {branches.length === 1 ? 'sucursal' : 'sucursales'}</span>
                        </div>
                        <div className='pco__cell pco__col-actions'>
                          <button
                            type='button'
                            className='pco__btn pco__btn--text'
                            onClick={() => { setSelectedCompanyId(company.id); setShowBranchModal(true) }}
                            title='Agregar sucursal'
                          >
                            <span className='material-symbols-rounded'>add_location_alt</span>
                            Sucursal
                          </button>
                          <button
                            type='button'
                            className='pco__btn'
                            onClick={() => { setSelectedCompany(company); setShowEditCompanyModal(true) }}
                            title='Editar empresa'
                            aria-label='Editar empresa'
                          >
                            <span className='material-symbols-rounded'>edit</span>
                          </button>
                        </div>
                      </div>

                      {branches.map((branch: any) => (
                        <div className='pco__row pco__row--branch' key={branch.id}>
                          <div className='pco__cell pco__cell--name'>
                            <span className='pco__icon pco__icon--branch'><span className='material-symbols-rounded'>storefront</span></span>
                            <div>
                              <strong>{branch.name}</strong>
                            </div>
                          </div>
                          <div className='pco__cell pco__muted'>{branch.address || '—'}</div>
                          <div className='pco__cell pco__col-actions'>
                            <button
                              type='button'
                              className='pco__btn'
                              onClick={() => { setSelectedBranch(branch); setShowEditBranchModal(true) }}
                              title='Editar sucursal'
                              aria-label='Editar sucursal'
                            >
                              <span className='material-symbols-rounded'>edit</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      {branches.length === 0 && (
                        <div className='pco__row pco__row--branch'>
                          <div className='pco__cell pco__muted'>Esta empresa aún no tiene sucursales.</div>
                          <span />
                          <span />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className='pco__empty'>
                <span className='material-symbols-rounded'>apartment</span>
                <strong>No tienes empresas asociadas</strong>
                <span>Crea tu primera empresa para comenzar</span>
              </div>
            )}
          </div>

          {/* Permisos */}
          {user.permissions && user.permissions.length > 0 && (
            <div className='profile__section'>
              <h2 className='profile__section-title'>Permisos ({user.permissions.length})</h2>
              {user.permissions.length > 20 ? (
                <div className='profile__all-permissions'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <h3>Acceso Total</h3>
                  <p>Este usuario tiene todos los permisos del sistema</p>
                  <span className='profile__permission-count'>{user.permissions.length} permisos asignados</span>
                </div>
              ) : (
                <div className='profile__permissions'>
                  {user.permissions.map((permission: string, index: number) => (
                    <span key={index} className='profile__permission-badge'>
                      {permission}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Estado de Cuenta */}
          <div className='profile__section profile__section--status'>
            <h2 className='profile__section-title'>Estado de Cuenta</h2>
            <div className='profile__grid'>
              <div className='profile__field'>
                <label className='profile__label'>Estado</label>
                <div className='profile__value'>
                  <span className={`profile__status ${user.active ? 'profile__status--active' : 'profile__status--inactive'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              <div className='profile__field'>
                <label className='profile__label'>ID de Usuario</label>
                <div className='profile__value'>{user.id || user._id || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <CreateCompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onSuccess={handleRefreshUser}
      />
      <CreateBranchModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        onSuccess={handleRefreshUser}
        companyId={selectedCompanyId || 0}
      />
      <EditCompanyModal
        isOpen={showEditCompanyModal}
        onClose={() => setShowEditCompanyModal(false)}
        onSuccess={handleRefreshUser}
        company={selectedCompany}
      />
      <EditBranchModal
        isOpen={showEditBranchModal}
        onClose={() => setShowEditBranchModal(false)}
        onSuccess={handleRefreshUser}
        branch={selectedBranch}
      />
    </div>
  )
}

export default Profile
