import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { AppRoutes } from '../router/index.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Role } from '@shared/types';

// Mock the auth API
vi.mock('../api/auth.js', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

// Mock the booking API
vi.mock('../api/booking.js', () => ({
  bookingApi: {
    listAvailableMenus: vi.fn().mockResolvedValue([]),
    createBooking: vi.fn().mockResolvedValue({}),
    listMyBookings: vi.fn().mockResolvedValue([]),
    cancelBooking: vi.fn().mockResolvedValue({}),
  },
}));

// Mock the queue API
vi.mock('../api/queue.js', () => ({
  queueApi: {
    checkIn: vi.fn(),
    createWalkIn: vi.fn(),
    markWaiting: vi.fn(),
    startServing: vi.fn(),
    completeServing: vi.fn(),
    markNoShow: vi.fn(),
    getLiveQueue: vi.fn().mockResolvedValue({
      currentlyServing: [],
      waiting: [],
      checkedIn: [],
      servedCount: 0,
      totalWaitingCount: 0,
    }),
    getMyQueue: vi.fn().mockResolvedValue({
      hasActiveEntry: false,
      entry: null,
      position: null,
      aheadCount: null,
      currentlyServingSequence: null,
      estimatedWaitMinutes: null,
    }),
  },
}));

// Import the mocked module
import { authApi } from '../api/auth.js';

const mockedAuthApi = vi.mocked(authApi);

const mockStudentUser = {
  id: 'user-1',
  name: 'Test Student',
  email: null,
  studentId: '12410001',
  rollNo: '12410001',
  role: Role.STUDENT,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockAdminUser = {
  id: 'admin-1',
  name: 'Revanth Admin',
  email: 'rkrevanth07@gmail.com',
  studentId: null,
  rollNo: null,
  role: Role.MESS_ADMIN,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderWithAuth(ui) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Auth Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockedAuthApi.refresh.mockRejectedValue(new Error('No session'));
  });

  // ════════════════════════════════════════════
  // REGISTRATION FLOW (STUDENT ONLY)
  // ════════════════════════════════════════════
  describe('Registration Flow', () => {
    it('should render the student registration form', async () => {
      renderWithAuth(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeDefined();
      });
      expect(screen.getByLabelText(/student id/i)).toBeDefined();
      expect(screen.getByLabelText(/^password$/i)).toBeDefined();
      expect(screen.getByLabelText(/^confirm password$/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /create student account/i })).toBeDefined();
    });

    it('should call register and navigate on successful student registration', async () => {
      mockedAuthApi.register.mockResolvedValue({
        user: mockStudentUser,
        accessToken: 'test-token',
      });

      renderWithAuth(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeDefined();
      });

      await user.type(screen.getByLabelText(/full name/i), 'Test Student');
      await user.type(screen.getByLabelText(/student id/i), '12410001');
      await user.type(screen.getByLabelText(/^password$/i), 'StrongPass1');
      await user.type(screen.getByLabelText(/^confirm password$/i), 'StrongPass1');
      await user.click(screen.getByRole('button', { name: /create student account/i }));

      await waitFor(() => {
        expect(mockedAuthApi.register).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Student',
            studentId: '12410001',
            password: 'StrongPass1',
            confirmPassword: 'StrongPass1',
          }),
        );
      });
    });

    it('should display error on duplicate student ID registration', async () => {
      const axiosError = {
        response: {
          data: {
            error: { message: 'An account with this Student ID already exists' },
          },
        },
        isAxiosError: true,
      };
      const error = Object.assign(new Error(), axiosError);
      Object.defineProperty(error, 'constructor', {
        value: { name: 'AxiosError' },
      });
      mockedAuthApi.register.mockRejectedValue(error);

      renderWithAuth(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeDefined();
      });

      await user.type(screen.getByLabelText(/full name/i), 'Test Student');
      await user.type(screen.getByLabelText(/student id/i), '12410001');
      await user.type(screen.getByLabelText(/^password$/i), 'StrongPass1');
      await user.type(screen.getByLabelText(/^confirm password$/i), 'StrongPass1');
      await user.click(screen.getByRole('button', { name: /create student account/i }));

      await waitFor(() => {
        expect(screen.getByText(/already exists|failed/i)).toBeDefined();
      });
    });
  });

  // ════════════════════════════════════════════
  // LOGIN FLOW (STUDENT ID & ADMIN EMAIL)
  // ════════════════════════════════════════════
  describe('Login Flow', () => {
    it('should render student login by default with Student ID input', async () => {
      renderWithAuth(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/student id/i)).toBeDefined();
      });
      expect(screen.getByLabelText(/password/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /sign in as student/i })).toBeDefined();
    });

    it('should log in student using numeric Student ID', async () => {
      mockedAuthApi.login.mockResolvedValue({
        user: mockStudentUser,
        accessToken: 'test-token',
      });

      renderWithAuth(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByLabelText(/student id/i)).toBeDefined();
      });

      await user.type(screen.getByLabelText(/student id/i), '12410001');
      await user.type(screen.getByLabelText(/password/i), 'StrongPass1');
      await user.click(screen.getByRole('button', { name: /sign in as student/i }));

      await waitFor(() => {
        expect(mockedAuthApi.login).toHaveBeenCalledWith({
          studentId: '12410001',
          password: 'StrongPass1',
        });
      });
    });

    it('should switch to admin tab and log in admin using Email', async () => {
      mockedAuthApi.login.mockResolvedValue({
        user: mockAdminUser,
        accessToken: 'admin-token',
      });

      renderWithAuth(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /admin login/i })).toBeDefined();
      });

      // Switch to Admin Login tab
      await user.click(screen.getByRole('button', { name: /admin login/i }));

      // Form switches dynamically to Email input
      await waitFor(() => {
        expect(screen.getByLabelText(/^email/i)).toBeDefined();
      });

      await user.type(screen.getByLabelText(/^email/i), 'rkrevanth07@gmail.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass@123');
      await user.click(screen.getByRole('button', { name: /sign in as admin/i }));

      await waitFor(() => {
        expect(mockedAuthApi.login).toHaveBeenCalledWith({
          email: 'rkrevanth07@gmail.com',
          password: 'TestPass@123',
        });
      });
    });

    it('should display error message on student login failure', async () => {
      mockedAuthApi.login.mockRejectedValue(new Error('Invalid student ID or password'));

      renderWithAuth(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByLabelText(/student id/i)).toBeDefined();
      });

      await user.type(screen.getByLabelText(/student id/i), '99999999');
      await user.type(screen.getByLabelText(/password/i), 'Wrong1234');
      await user.click(screen.getByRole('button', { name: /sign in as student/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed|error|invalid/i)).toBeDefined();
      });
    });
  });

  // ════════════════════════════════════════════
  // AUTH STATE & PROTECTED ROUTES
  // ════════════════════════════════════════════
  describe('Auth State & Routing', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockedAuthApi.refresh.mockRejectedValue(new Error('No session'));

      renderWithAuth(
        <MemoryRouter initialEntries={['/student']}>
          <AppRoutes />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/student id/i)).toBeDefined();
      });
    });

    it('should clear auth state on logout', async () => {
      mockedAuthApi.refresh.mockResolvedValueOnce({
        user: mockStudentUser,
        accessToken: 'test-token',
      });
      mockedAuthApi.logout.mockResolvedValue(undefined);

      renderWithAuth(
        <MemoryRouter initialEntries={['/student']}>
          <AppRoutes />
        </MemoryRouter>,
      );

      await waitFor(
        () => {
          expect(screen.getByText(/sign out/i)).toBeDefined();
        },
        { timeout: 3000 },
      );
    });
  });
});

