import { useCallback } from 'react';
import { ROLE_PERMISSIONS, type Permission, type PersonaRole } from '@/types/domain';
import { useUi } from '@/state/UiProvider';

export function useCan(): (permission: Permission) => boolean {
  const { activeRole } = useUi();
  return useCallback(
    (permission: Permission) => {
      const perms = ROLE_PERMISSIONS[activeRole];
      return perms?.includes(permission) ?? false;
    },
    [activeRole],
  );
}

export function hasPermission(role: PersonaRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
