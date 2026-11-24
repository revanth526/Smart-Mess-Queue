import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './router';

/**
 * Single QueryClient for the entire app.
 * - staleTime: 60s  → data is fresh for 60 s, no refetch on remount
 * - gcTime: 5 min   → cached data stays in memory for 5 minutes
 * - refetchOnWindowFocus: false → avoids refetch storms on tab switch
 * - retry: 1        → one retry on network error (not on 401/403/404)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        // Don't retry on auth/not-found errors
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}
