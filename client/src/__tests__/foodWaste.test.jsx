import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx';
import { ProtectedRoute } from '../components/ProtectedRoute.jsx';
import { Role, MealType } from '@shared/types';
import { foodLogApi } from '../api/foodLog.js';
import { adminApi } from '../api/admin.js';

// Mock auth hook
let mockUser = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: Role.MESS_ADMIN,
};

vi.mock('../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
    isAuthenticated: Boolean(mockUser),
    isLoading: false,
  }),
}));

// Mock adminApi
vi.mock('../api/admin.js', () => ({
  adminApi: {
    getMessConfig: vi.fn(),
    updateMess: vi.fn(),
    updateMealConfig: vi.fn(),
    listMenuItems: vi.fn().mockResolvedValue([]),
    createMenuItem: vi.fn(),
    updateMenuItem: vi.fn(),
    updateMenuItemStatus: vi.fn(),
    deleteMenuItem: vi.fn(),
    listMenus: vi.fn().mockResolvedValue([]),
    getMenu: vi.fn(),
    createMenu: vi.fn(),
    deleteMenu: vi.fn(),
    addDish: vi.fn(),
    removeDish: vi.fn(),
    getTimeSlots: vi.fn().mockResolvedValue([]),
    generateTimeSlots: vi.fn(),
  },
}));

// Mock queueApi
vi.mock('../api/queue.js', () => ({
  queueApi: {
    getLiveQueue: vi.fn().mockResolvedValue({
      currentlyServing: [],
      waiting: [],
      checkedIn: [],
      servedCount: 0,
      totalWaitingCount: 0,
    }),
  },
}));

// Mock socket
vi.mock('../services/socket.js', () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  subscribeToLiveQueue: vi.fn(),
  unsubscribeFromLiveQueue: vi.fn(),
}));

// Mock foodLogApi
vi.mock('../api/foodLog.js', () => ({
  foodLogApi: {
    listFoodLogs: vi.fn(),
    getFoodLog: vi.fn(),
    createFoodLog: vi.fn(),
    updateFoodLog: vi.fn(),
    getAnalytics: vi.fn(),
  },
}));

const mockedAdminApi = vi.mocked(adminApi);
const mockedFoodLogApi = vi.mocked(foodLogApi);

const mockMessConfig = {
  mess: {
    id: 'mess-1',
    name: 'Central Dining Hall',
    location: 'North Campus',
    totalCapacity: 500,
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  mealConfigs: [],
};

const mockAnalytics = {
  summary: {
    totalPreparedKg: 300,
    totalServedKg: 240,
    totalWastedKg: 30,
    totalRemainingKg: 30,
    wastePercentage: 10,
    recordCount: 3,
  },
  byMeal: [
    {
      mealType: MealType.LUNCH,
      totalPreparedKg: 100,
      totalServedKg: 80,
      totalWastedKg: 10,
      totalRemainingKg: 10,
      wastePercentage: 10,
      recordCount: 1,
    },
  ],
  byDate: [
    {
      date: '2026-10-03',
      totalPreparedKg: 100,
      totalServedKg: 80,
      totalWastedKg: 10,
      totalRemainingKg: 10,
      wastePercentage: 10,
      recordCount: 1,
    },
  ],
};

const mockLogs = [
  {
    id: 'log-1',
    messId: 'mess-1',
    menuId: 'menu-1',
    date: '2026-10-03',
    mealType: MealType.LUNCH,
    preparedKg: 100,
    servedKg: 80,
    wastedKg: 10,
    remainingKg: 10,
    wastePercentage: 10,
    notes: 'Smooth lunch service',
    createdById: 'admin-1',
    createdAt: '2026-10-03T12:00:00.000Z',
    updatedAt: '2026-10-03T12:00:00.000Z',
  },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe('Food Waste Tracking & Analytics UI (Phase 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: Role.MESS_ADMIN,
    };
    mockedAdminApi.getMessConfig.mockResolvedValue(mockMessConfig);
    mockedFoodLogApi.listFoodLogs.mockResolvedValue(mockLogs);
    mockedFoodLogApi.getAnalytics.mockResolvedValue(mockAnalytics);
  });

  it('renders the Food Waste & Analytics tab with form inputs and metrics', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>,
    );

    // Switch to Food Waste & Analytics tab
    const wasteTabButton = screen.getByRole('button', { name: /food waste & analytics/i });
    await user.click(wasteTabButton);

    // Wait for lazy-loaded tab content to resolve through Suspense
    await waitFor(() => {
      expect(screen.getByText(/Food Waste & Production Analytics/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Check form fields
    expect(screen.getByLabelText('Service Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Meal Session')).toBeInTheDocument();
    expect(screen.getByLabelText('Prepared Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Served Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Wasted Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log Food Record/i })).toBeInTheDocument();
  });

  it('renders the analytics summary cards accurately', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: /food waste & analytics/i }));

    // Wait for lazy-loaded tab + data to be ready
    await waitFor(() => {
      expect(screen.getByTestId('stat-prepared')).toHaveTextContent('300');
      expect(screen.getByTestId('stat-served')).toHaveTextContent('240');
      expect(screen.getByTestId('stat-waste-pct')).toHaveTextContent('10%');
    }, { timeout: 5000 });
  });

  it('displays real-time validation warning when Served + Wasted > Prepared', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: /food waste & analytics/i }));

    const prepInput = screen.getByLabelText('Prepared Amount');
    const servInput = screen.getByLabelText('Served Amount');
    const wastInput = screen.getByLabelText('Wasted Amount');

    await user.type(prepInput, '100');
    await user.type(servInput, '80');
    await user.type(wastInput, '30'); // 80 + 30 = 110 > 100

    expect(
      screen.getByText(/Invalid: Served \(80kg\) \+ Wasted \(30kg\) exceeds Prepared \(100kg\)/i),
    ).toBeInTheDocument();

    // Submit button should be disabled
    const submitButton = screen.getByRole('button', { name: /Log Food Record/i });
    expect(submitButton).toBeDisabled();
  });

  it('successfully submits a valid food record and displays feedback banner', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    mockedFoodLogApi.createFoodLog.mockResolvedValueOnce({
      ...mockLogs[0],
      id: 'log-new',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: /food waste & analytics/i }));

    const prepInput = screen.getByLabelText('Prepared Amount');
    const servInput = screen.getByLabelText('Served Amount');
    const wastInput = screen.getByLabelText('Wasted Amount');

    await user.type(prepInput, '50');
    await user.type(servInput, '40');
    await user.type(wastInput, '5');

    const submitBtn = screen.getByRole('button', { name: /Log Food Record/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(foodLogApi.createFoodLog).toHaveBeenCalledWith(
        expect.objectContaining({
          preparedKg: 50,
          servedKg: 40,
          wastedKg: 5,
        }),
      );
      expect(screen.getByText(/Food record logged successfully!/i)).toBeInTheDocument();
    });
  });

  it('updates historical record query when meal filter changes', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: /food waste & analytics/i }));

    const filterMealSelect = screen.getByLabelText(/Filter Meal Session/i);
    await user.selectOptions(filterMealSelect, MealType.DINNER);

    await waitFor(() => {
      expect(foodLogApi.listFoodLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          mealType: MealType.DINNER,
        }),
      );
    });
  });

  it('renders the visual food waste analytics charts with real analytics data', async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AdminDashboardPage />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: /food waste & analytics/i }));

    // Verify Visual Waste Analytics section is rendered
    await waitFor(() => {
      expect(screen.getByTestId('food-waste-charts-section')).toBeInTheDocument();
      expect(screen.getByText('Visual Waste Analytics')).toBeInTheDocument();
      expect(screen.getByTestId('chart-meal-comparison')).toBeInTheDocument();
      expect(screen.getByTestId('chart-daily-trend')).toBeInTheDocument();
      expect(screen.getByText('Meal-wise Food Comparison')).toBeInTheDocument();
      expect(screen.getByText('Daily Food Waste Trend')).toBeInTheDocument();
    });

    // Check legend items
    expect(screen.getAllByText('Prepared').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Served').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Wasted/i).length).toBeGreaterThanOrEqual(1);

    // Verify SVG charts render
    const comparisonChart = screen.getByTestId('chart-meal-comparison');
    expect(comparisonChart.querySelector('svg')).toBeInTheDocument();
    const trendChart = screen.getByTestId('chart-daily-trend');
    expect(trendChart.querySelector('svg')).toBeInTheDocument();
  });

  it('guards admin routes so a STUDENT user cannot access admin management UI', () => {
    mockUser = {
      id: 'student-1',
      name: 'Student User',
      email: 'student@example.com',
      role: Role.STUDENT,
    };

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={[Role.MESS_ADMIN]} />}>
            <Route path="/admin" element={<div>Admin Secret Dashboard</div>} />
          </Route>
          <Route path="/" element={<div>Home Landing Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Student should be redirected to home page
    expect(screen.queryByText('Admin Secret Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Home Landing Page')).toBeInTheDocument();
  });
});

