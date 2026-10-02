import type { ReactNode } from 'react';
import type { Permission, PersonaRole } from '@/types/domain';
import { ROLE_PERMISSIONS } from '@/types/domain';
import { useCan } from '@/hooks/useCan';
import { useUi } from '@/state/UiProvider';
import { PermissionDeniedState } from '@/components/common/States';

interface RequireCanProps {
  permission: Permission;
  children: ReactNode;
}

/** Renders children only when the active role has the given permission. */
export function RequireCan({ permission, children }: RequireCanProps): React.JSX.Element {
  const can = useCan();
  if (!can(permission)) {
    return <PermissionDeniedState />;
  }
  return <>{children}</>;
}

interface RequireRoleProps {
  role: PersonaRole;
  children: ReactNode;
}

/** Renders children only when the active role matches the required role. */
export function RequireRole({ role, children }: RequireRoleProps): React.JSX.Element {
  const { activeRole } = useUi();
  if (activeRole !== role) {
    return <PermissionDeniedState resource="this role-restricted view" />;
  }
  return <>{children}</>;
}
