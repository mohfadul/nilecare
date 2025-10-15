import { ReactNode } from 'react';
import { authStore } from '../../store/authStore';

interface RoleGateProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
}

export function RoleGate({ children, roles, fallback = null }: RoleGateProps) {
  const user = authStore((state) => state.user);

  // Allow wildcard '*' to show for all roles
  if (roles.includes('*')) {
    return <>{children}</>;
  }

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

