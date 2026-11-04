import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '@shared/types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  redirectTo?: string;
}

/**
 * Route guard component. Redirects unauthenticated users to login
 * and unauthorized users to home.
 */
export function ProtectedRoute({ allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
