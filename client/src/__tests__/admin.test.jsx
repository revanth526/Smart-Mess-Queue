import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx';
import { Role, MealType } from '@shared/types';

// Mock auth hook
const mockLogout = vi.fn();
vi.mock('../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: Role.MESS_ADMIN,
    },
    logout: mockLogout,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock adminApi
vi.mock('../api/admin.js', () => ({
  adminApi: {
    getMessConfig: vi.fn(),
    updateMess: vi.fn(),
    updateMealConfig: vi.fn(),
    listMenuItems: vi.fn(),
    createMenuItem: vi.fn(),
    updateMenuItem: vi.fn(),
    updateMenuItemStatus: vi.fn(),
    deleteMenuItem: vi.fn(),
    listMenus: vi.fn(),
    getMenu: vi.fn(),
    createMenu: vi.fn(),
    deleteMenu: vi.fn(),
    addDish: vi.fn(),
    removeDish: vi.fn(),
    getTimeSlots: vi.fn(),
    generateTimeSlots: vi.fn(),
  },
}));

// Mock queueApi
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

import { adminApi } from '../api/admin.js';
const mockedAdminApi = vi.mocked(adminApi);

const mockMess = {
  id: 'mess-1',
  name: 'Central Dining Hall',
  location: 'Campus Center',
  totalCapacity: 500,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockMealConfigs = [
  {
    id: 'cfg-1',
    messId: 'mess-1',
    mealType: MealType.BREAKFAST,
    startTime: '07:30',
    endTime: '09:30',
    slotDurationMinutes: 20,
    bookingCutoffMinutes: 30,
    cancellationCutoffMinutes: 30,
    defaultSlotCapacity: 50,
    averageServingTimeSeconds: 30,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockMenuItems = [
  {
    id: 'item-1',
    messId: 'mess-1',
    name: 'Idli Sambhar',
    category: 'Breakfast',
    defaultServingGrams: 200,
    isAvailable: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockMenus = [
  {
    id: 'menu-1',
    messId: 'mess-1',
    date: '2026-10-03T00:00:00.000Z',
    mealType: MealType.BREAKFAST,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    dishes: [
      {
        id: 'dish-1',
        menuId: 'menu-1',
        menuItemId: 'item-1',
        dishName: 'Idli Sambhar',
        dishCategory: 'Breakfast',
        servingGrams: 200,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    slots: [
      {
        id: 'slot-1',
        menuId: 'menu-1',
        startTime: '2026-10-03T07:30:00.000Z',
        endTime: '2026-10-03T07:50:00.000Z',
        capacity: 50,
        currentBookings: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  },
];

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Admin Management UI (Phase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAdminApi.getMessConfig.mockResolvedValue({
      mess: mockMess,
      mealConfigs: mockMealConfigs,
    });
    mockedAdminApi.listMenuItems.mockResolvedValue(mockMenuItems);
    mockedAdminApi.listMenus.mockResolvedValue(mockMenus);
  });

  it('should render admin page header and all 3 management tabs', async () => {
    renderWithClient(<AdminDashboardPage />);

    expect(screen.getByText('Smart Mess Admin')).toBeDefined();
    expect(screen.getByText('Daily Menus & Slots')).toBeDefined();
    expect(screen.getByText('Menu Items Catalog')).toBeDefined();
    expect(screen.getByText('Mess Settings & Timings')).toBeDefined();
  });

  it('should switch to Menu Items Catalog tab and display dishes', async () => {
    const user = userEvent.setup();
    renderWithClient(<AdminDashboardPage />);

    const catalogTabButton = screen.getByText('Menu Items Catalog');
    await user.click(catalogTabButton);

    await waitFor(() => {
      expect(screen.getByText('Idli Sambhar')).toBeDefined();
      expect(screen.getByText('+ Add Menu Item')).toBeDefined();
    });
  });

  it('should switch to Mess Settings tab and show dining hall details', async () => {
    const user = userEvent.setup();
    renderWithClient(<AdminDashboardPage />);

    const messTabButton = screen.getByText('Mess Settings & Timings');
    await user.click(messTabButton);

    await waitFor(() => {
      expect(screen.getByText('Central Dining Hall')).toBeDefined();
      expect(screen.getByText('500 seats')).toBeDefined();
      expect(screen.getByText('07:30 – 09:30')).toBeDefined();
    });
  });

  it('should call logout when sign out is clicked', async () => {
    const user = userEvent.setup();
    renderWithClient(<AdminDashboardPage />);

    const logoutBtn = screen.getByRole('button', { name: /sign out/i });
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

