import { useSelector } from 'react-redux'

/**
 * Devuelve `can(permiso)`: true si el usuario tiene ese permiso (por su rol o por permisos extra).
 * El dueño (cuenta ACCOUNT/SYSTEM con rol de nivel 0 o 1) puede todo, igual que en useModules.
 */
export function useCan() {
  const permissions: string[] = useSelector((state: any) => state.user?.permissions ?? [])
  const userKind: string | undefined = useSelector((state: any) => state.user?.userKind)
  const roleLevel: number = useSelector((state: any) => state.user?.role?.level ?? state.user?.roleLevel ?? 99)

  const isOwner = (userKind === 'ACCOUNT' || userKind === 'SYSTEM') && roleLevel <= 1

  return (permission: string): boolean => isOwner || permissions.includes(permission)
}
