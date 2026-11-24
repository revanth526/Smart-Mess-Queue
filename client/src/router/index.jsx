import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { Role } from '@shared/types';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';

// Lazy-load heavy authenticated dashboards only.
// LoginPage & RegisterPage remain lightweight static imports for immediate first-paint.
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage.jsx'));
const StudentBookingPage = lazy(() => import('../pages/StudentBookingPage.jsx'));

/** Full-screen spinner used while a page chunk is loading. */
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );
}

/**
 * Redirects authenticated users to their role-based dashboard.
 * Unauthenticated users see the login page.
 */
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleUpper = String(user?.role || '').toUpperCase();
  if (roleUpper === Role.MESS_ADMIN || roleUpper === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/student" replace />;
}

/**
 * Redirects already-authenticated users away from login/register pages.
 */
function GuestRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    const roleUpper = String(user?.role || '').toUpperCase();
    if (roleUpper === Role.MESS_ADMIN || roleUpper === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Guest-only routes (redirect to dashboard if already logged in) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        {/* Student-protected routes */}
        <Route element={<ProtectedRoute allowedRoles={[Role.STUDENT]} />}>
          <Route path="/student" element={<StudentBookingPage />} />
        </Route>

        {/* Admin-protected routes */}
        <Route element={<ProtectedRoute allowedRoles={[Role.MESS_ADMIN]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

