import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

/**
 * Route guard component. Redirects unauthenticated users to login
 * and unauthorized users to home.
 */
export function ProtectedRoute({ allowedRoles, redirectTo = '/login' }) {
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

  if (allowedRoles && user) {
    const uRole = String(user.role || '').toUpperCase();
    const isAuthorized = allowedRoles.some((targetRole) => {
      const tRole = String(targetRole || '').toUpperCase();
      if (uRole === tRole) return true;
      if (
        (uRole === 'MESS_ADMIN' || uRole === 'ADMIN') &&
        (tRole === 'MESS_ADMIN' || tRole === 'ADMIN')
      ) {
        return true;
      }
      return false;
    });

    if (!isAuthorized) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}

