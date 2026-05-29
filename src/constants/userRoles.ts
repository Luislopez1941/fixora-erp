export const USER_KIND_META = {
  SYSTEM: {
    label: 'Sistema',
    description: 'Acceso global de plataforma.',
  },
  ACCOUNT: {
    label: 'Administrador',
    description: 'Dueño o responsable de la empresa.',
  },
  STAFF: {
    label: 'Personal',
    description: 'Trabajador operativo con rol asignado.',
  },
} as const;

export const ROLE_LABELS: Record<string, string> = {
  // Plataforma
  super_admin: 'Super Admin',
  owner: 'Owner',
  platform_admin: 'Admin Plataforma',
  support: 'Soporte',
  developer: 'Developer',
  auditor: 'Auditor',
  // Operativos
  manager: 'Gerente',
  cashier: 'Cajero',
  warehouse: 'Almacén',
  production: 'Producción',
  driver: 'Repartidor',
};

export function getRoleLabel(roleName?: string | null) {
  if (!roleName) return '—';
  return ROLE_LABELS[roleName] ?? roleName;
}

export function getFullName(user: {
  firstName?: string;
  secondName?: string;
  firstLastName?: string;
  secondLastName?: string;
  businessName?: string;
  email?: string;
}) {
  const parts = [
    user.firstName,
    user.secondName,
    user.firstLastName,
    user.secondLastName,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(' ');
  return user.businessName || user.email || '—';
}
