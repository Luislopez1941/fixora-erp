import React from 'react'
import './SupervisorsList.css'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'

/** Quiénes pueden autorizar: dueños y administradores, o roles de nivel 2 o menor. */
const SupervisorsList: React.FC<{ supervisors: { id: number; name: string; email: string }[] }> = ({ supervisors }) => (
  <section className='cash-ui__card supervisors-list'>
    <h2>Pueden autorizar <small>{supervisors.length}</small></h2>
    <p className='supervisors-list__help'>Autorizan cierres y egresos de caja con su usuario y contraseña: dueños y administradores, o usuarios con un rol de nivel 2 o menor. Se cambia desde Roles y Usuarios.</p>
    {!supervisors.length ? (
      <p className='supervisors-list__help'>No hay supervisores activos: las operaciones que piden autorización no se podrán completar.</p>
    ) : (
      <ul>
        {supervisors.map((u) => (
          <li key={u.id}>
            <span className='supervisors-list__avatar' aria-hidden>{initials(u.name)}</span>
            <span>
              <strong>{u.name}</strong>
              <small>{u.email}</small>
            </span>
          </li>
        ))}
      </ul>
    )}
  </section>
)

export default SupervisorsList
