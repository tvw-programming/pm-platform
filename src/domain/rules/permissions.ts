import { ROLE_PERMISSIONS, type Permission, type PersonaRole } from '@/types/domain';

export function hasPermission(role: PersonaRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function filterByPermission<T extends { permission?: Permission }>(
  items: T[],
  role: PersonaRole,
): T[] {
  return items.filter(item => !item.permission || hasPermission(role, item.permission));
}
