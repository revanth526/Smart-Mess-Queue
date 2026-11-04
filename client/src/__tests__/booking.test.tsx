import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StudentBookingPage from '../pages/StudentBookingPage';
import { Role, MealType, BookingStatus, EntryType } from '@shared/types';

// Mock auth hook
const mockLogout = vi.fn();
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'student-1',
      name: 'Test Student',
      email: 'student@example.com',
      rollNo: 'CS2023001',
      role: Role.STUDENT,
    },
    logout: mockLogout,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock bookingApi
vi.mock('../api/booking', () => ({
  bookingApi: {
    listAvailableMenus: vi.fn(),
    listMyBookings: vi.fn(),
    createBooking: vi.fn(),
    cancelBooking: vi.fn(),
    getBooking: vi.fn(),
  },
}));

// Mock queueApi
vi.mock('../api/queue', () => ({
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

import { bookingApi } from '../api/booking';
const mockedBookingApi = vi.mocked(bookingApi);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowDateStr = tomorrow.toISOString().slice(0, 10);

const mockMenus = [
  {
    id: 'menu-1',
    messId: 'mess-1',
    date: `${tomorrowDateStr}T00:00:00.000Z`,
    mealType: MealType.LUNCH,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    dishes: [
      {
        id: 'dish-1',
        menuId: 'menu-1',
        menuItemId: 'item-1',
        dishName: 'Paneer Butter Masala',
        dishCategory: 'Main Course',
        servingGrams: 150,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    slots: [
      {
        id: 'slot-1',
        menuId: 'menu-1',
        startTime: `${tomorrowDateStr}T12:00:00.000Z`,
        endTime: `${tomorrowDateStr}T12:30:00.000Z`,
        capacity: 50,
        currentBookings: 10, // 40 seats left
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'slot-2',
        menuId: 'menu-1',
        startTime: `${tomorrowDateStr}T12:30:00.000Z`,
        endTime: `${tomorrowDateStr}T13:00:00.000Z`,
        capacity: 50,
        currentBookings: 50, // Full slot!
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  },
];

const mockBookings = [
  {
    id: 'booking-1',
    studentId: 'student-1',
    menuId: 'menu-1',
    slotId: 'slot-1',
    status: BookingStatus.BOOKED,
    entryType: EntryType.BOOKING,
    bookedAt: '2024-01-01T00:00:00.000Z',
    checkedInAt: null,
    waitingAt: null,
    servingAt: null,
    servedAt: null,
    cancelledAt: null,
    noShowAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    menu: mockMenus[0],
    slot: mockMenus[0].slots[0],
  },
];

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Student Booking UI (Phase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedBookingApi.listAvailableMenus.mockResolvedValue(mockMenus);
    mockedBookingApi.listMyBookings.mockResolvedValue([]);
  });

  it('should render header with student name and roll number', async () => {
    renderWithClient(<StudentBookingPage />);

    expect(screen.getByText('Smart Mess Portal')).toBeDefined();
    expect(screen.getByText('Test Student')).toBeDefined();
    expect(screen.getByText('Roll No: CS2023001')).toBeDefined();
    expect(screen.getByText('Book Meals')).toBeDefined();
    expect(screen.getByText('My Bookings')).toBeDefined();
  });

  it('should display available menus, dishes, and slots with remaining seats', async () => {
    renderWithClient(<StudentBookingPage />);

    await waitFor(() => {
      expect(screen.getByText('LUNCH')).toBeDefined();
      expect(screen.getByText('Paneer Butter Masala')).toBeDefined();
      expect(screen.getByText('40 seats left')).toBeDefined();
      expect(screen.getByText('Full')).toBeDefined();
    });
  });

  it('should book a selected slot successfully and navigate to My Bookings', async () => {
    const user = userEvent.setup();
    mockedBookingApi.createBooking.mockResolvedValue(mockBookings[0]);

    renderWithClient(<StudentBookingPage />);

    // Click available slot
    await waitFor(() => {
      expect(screen.getByText('40 seats left')).toBeDefined();
    });

    const slotBtn = screen.getByText('40 seats left').closest('button');
    expect(slotBtn).toBeDefined();
    await user.click(slotBtn!);

    // Confirm booking banner appears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm booking/i })).toBeDefined();
    });

    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    await waitFor(() => {
      expect(mockedBookingApi.createBooking).toHaveBeenCalledWith({
        menuId: 'menu-1',
        slotId: 'slot-1',
      });
    });
  });

  it('should allow student to cancel an active booking from My Bookings', async () => {
    const user = userEvent.setup();
    mockedBookingApi.listMyBookings.mockResolvedValue(mockBookings);
    mockedBookingApi.cancelBooking.mockResolvedValue({
      ...mockBookings[0],
      status: BookingStatus.CANCELLED,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithClient(<StudentBookingPage />);

    // Switch to My Bookings
    const myBookingsTab = screen.getByText('My Bookings');
    await user.click(myBookingsTab);

    await waitFor(() => {
      expect(screen.getByText('BOOKED')).toBeDefined();
      expect(screen.getByRole('button', { name: /cancel booking/i })).toBeDefined();
    });

    await user.click(screen.getByRole('button', { name: /cancel booking/i }));

    await waitFor(() => {
      expect(mockedBookingApi.cancelBooking).toHaveBeenCalledWith('booking-1');
    });
  });
});
