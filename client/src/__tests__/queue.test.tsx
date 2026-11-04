import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LiveQueueTab } from '../components/admin/LiveQueueTab';
import StudentBookingPage from '../pages/StudentBookingPage';
import { Role, MealType, QueueStatus, EntryType, BookingStatus } from '@shared/types';

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

// Mock socket service
vi.mock('../services/socket', () => ({
  getSocket: vi.fn(),
  updateSocketToken: vi.fn(),
  subscribeToQueue: vi.fn(() => vi.fn()),
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
    getLiveQueue: vi.fn(),
    getMyQueue: vi.fn(),
  },
}));

import { bookingApi } from '../api/booking';
import { queueApi } from '../api/queue';

const mockedBookingApi = vi.mocked(bookingApi);
const mockedQueueApi = vi.mocked(queueApi);

const mockMenu = {
  id: 'menu-1',
  messId: 'mess-1',
  date: '2026-10-03',
  mealType: MealType.LUNCH,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  dishes: [],
  slots: [],
};

const mockLiveQueue = {
  menuId: 'menu-1',
  currentlyServing: [
    {
      id: 'entry-1',
      menuId: 'menu-1',
      slotId: 'slot-1',
      bookingId: 'booking-1',
      studentId: 'student-1',
      entryType: EntryType.BOOKING,
      status: QueueStatus.SERVING,
      sequenceNumber: 1,
      studentIdentifier: 'CS2023001',
      checkedInAt: '2026-10-03T12:00:00.000Z',
      servingStartedAt: '2026-10-03T12:05:00.000Z',
      servedAt: null,
      createdAt: '2026-10-03T12:00:00.000Z',
      updatedAt: '2026-10-03T12:05:00.000Z',
    },
  ],
  waiting: [
    {
      id: 'entry-2',
      menuId: 'menu-1',
      slotId: 'slot-1',
      bookingId: 'booking-2',
      studentId: 'student-2',
      entryType: EntryType.BOOKING,
      status: QueueStatus.WAITING,
      sequenceNumber: 2,
      studentIdentifier: 'CS2023002',
      checkedInAt: '2026-10-03T12:02:00.000Z',
      servingStartedAt: null,
      servedAt: null,
      createdAt: '2026-10-03T12:02:00.000Z',
      updatedAt: '2026-10-03T12:02:00.000Z',
    },
  ],
  checkedIn: [],
  servedCount: 10,
  totalWaitingCount: 1,
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Queue UI (Phase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedBookingApi.listAvailableMenus.mockResolvedValue([mockMenu]);
    mockedBookingApi.listMyBookings.mockResolvedValue([]);
    mockedQueueApi.getLiveQueue.mockResolvedValue(mockLiveQueue);
    mockedQueueApi.getMyQueue.mockResolvedValue({
      hasActiveEntry: false,
      entry: null,
      position: null,
      aheadCount: null,
      currentlyServingSequence: null,
      estimatedWaitMinutes: null,
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // ADMIN LIVE QUEUE TAB
  // ══════════════════════════════════════════════════════════════════════
  describe('Admin Live Queue Tab', () => {
    it('should display metrics and allow admin to add a walk-in entry', async () => {
      const user = userEvent.setup();
      mockedQueueApi.createWalkIn.mockResolvedValue({
        id: 'entry-3',
        menuId: 'menu-1',
        slotId: null,
        bookingId: null,
        studentId: null,
        entryType: EntryType.WALK_IN,
        status: QueueStatus.WAITING,
        sequenceNumber: 3,
        studentIdentifier: 'Walk-in Guest',
        checkedInAt: '2026-10-03T12:10:00.000Z',
        servingStartedAt: null,
        servedAt: null,
        createdAt: '2026-10-03T12:10:00.000Z',
        updatedAt: '2026-10-03T12:10:00.000Z',
      });

      renderWithClient(<LiveQueueTab />);

      await waitFor(() => {
        expect(screen.getByText('Live Mess Queue Counter')).toBeDefined();
        expect(screen.getByText('#1')).toBeDefined(); // Serving entry sequence
      });

      const input = screen.getByPlaceholderText(/Identifier/i);
      await user.type(input, 'Walk-in Guest');

      const addBtn = screen.getByRole('button', { name: /\+ Insert into Queue/i });
      await user.click(addBtn);

      await waitFor(() => {
        expect(mockedQueueApi.createWalkIn).toHaveBeenCalledWith({
          menuId: 'menu-1',
          studentIdentifier: 'Walk-in Guest',
        });
      });
    });

    it('should allow admin to complete serving an active entry', async () => {
      const user = userEvent.setup();
      mockedQueueApi.completeServing.mockResolvedValue({
        ...mockLiveQueue.currentlyServing[0],
        status: QueueStatus.SERVED,
        servedAt: '2026-10-03T12:08:00.000Z',
      });

      renderWithClient(<LiveQueueTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Complete Serving/i })).toBeDefined();
      });

      await user.click(screen.getByRole('button', { name: /Complete Serving/i }));

      await waitFor(() => {
        expect(mockedQueueApi.completeServing).toHaveBeenCalledWith('entry-1');
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  // STUDENT QUEUE TICKET & CHECK-IN
  // ══════════════════════════════════════════════════════════════════════
  describe('Student Queue View', () => {
    it('should display active ticket position and wait time in Live Queue tab', async () => {
      const user = userEvent.setup();
      mockedQueueApi.getMyQueue.mockResolvedValue({
        hasActiveEntry: true,
        entry: {
          id: 'entry-my-1',
          menuId: 'menu-1',
          slotId: 'slot-1',
          bookingId: 'booking-1',
          studentId: 'student-1',
          entryType: EntryType.BOOKING,
          status: QueueStatus.WAITING,
          sequenceNumber: 15,
          studentIdentifier: 'CS2023001',
          checkedInAt: '2026-10-03T12:00:00.000Z',
          servingStartedAt: null,
          servedAt: null,
          createdAt: '2026-10-03T12:00:00.000Z',
          updatedAt: '2026-10-03T12:00:00.000Z',
        },
        position: 3,
        aheadCount: 2,
        currentlyServingSequence: 12,
        estimatedWaitMinutes: 2,
      });

      renderWithClient(<StudentBookingPage />);

      // Switch to Live Queue tab
      const queueTabBtn = screen.getByRole('button', { name: /Live Queue/i });
      await user.click(queueTabBtn);

      await waitFor(() => {
        expect(screen.getByText('Queue Ticket #15')).toBeDefined();
        expect(screen.getByText('WAITING IN LINE')).toBeDefined();
        expect(screen.getByText('#3')).toBeDefined(); // position in line
        expect(screen.getByText('~2 min')).toBeDefined(); // estimated wait
      });
    });

    it('should allow student to join waiting line when checked in', async () => {
      const user = userEvent.setup();
      mockedQueueApi.getMyQueue.mockResolvedValue({
        hasActiveEntry: true,
        entry: {
          id: 'entry-my-2',
          menuId: 'menu-1',
          slotId: 'slot-1',
          bookingId: 'booking-2',
          studentId: 'student-1',
          entryType: EntryType.BOOKING,
          status: QueueStatus.CHECKED_IN,
          sequenceNumber: 20,
          studentIdentifier: 'CS2023001',
          checkedInAt: '2026-10-03T12:00:00.000Z',
          servingStartedAt: null,
          servedAt: null,
          createdAt: '2026-10-03T12:00:00.000Z',
          updatedAt: '2026-10-03T12:00:00.000Z',
        },
        position: null,
        aheadCount: null,
        currentlyServingSequence: null,
        estimatedWaitMinutes: null,
      });

      mockedQueueApi.markWaiting.mockResolvedValue({
        id: 'entry-my-2',
        menuId: 'menu-1',
        slotId: 'slot-1',
        bookingId: 'booking-2',
        studentId: 'student-1',
        entryType: EntryType.BOOKING,
        status: QueueStatus.WAITING,
        sequenceNumber: 20,
        studentIdentifier: 'CS2023001',
        checkedInAt: '2026-10-03T12:00:00.000Z',
        servingStartedAt: null,
        servedAt: null,
        createdAt: '2026-10-03T12:00:00.000Z',
        updatedAt: '2026-10-03T12:00:00.000Z',
      });

      renderWithClient(<StudentBookingPage />);

      const queueTabBtn = screen.getByRole('button', { name: /Live Queue/i });
      await user.click(queueTabBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Join Waiting Line/i })).toBeDefined();
      });

      await user.click(screen.getByRole('button', { name: /Join Waiting Line/i }));

      await waitFor(() => {
        expect(mockedQueueApi.markWaiting).toHaveBeenCalledWith('entry-my-2');
      });
    });

    it('should allow student to check in from My Bookings tab', async () => {
      const user = userEvent.setup();
      mockedBookingApi.listMyBookings.mockResolvedValue([
        {
          id: 'booking-1',
          studentId: 'student-1',
          menuId: 'menu-1',
          slotId: 'slot-1',
          status: BookingStatus.BOOKED,
          entryType: EntryType.BOOKING,
          bookedAt: '2026-10-03T10:00:00.000Z',
          checkedInAt: null,
          waitingAt: null,
          servingAt: null,
          servedAt: null,
          cancelledAt: null,
          noShowAt: null,
          createdAt: '2026-10-03T10:00:00.000Z',
          updatedAt: '2026-10-03T10:00:00.000Z',
          menu: mockMenu,
          slot: {
            id: 'slot-1',
            menuId: 'menu-1',
            startTime: '2026-10-03T12:00:00.000Z',
            endTime: '2026-10-03T12:30:00.000Z',
            capacity: 50,
            currentBookings: 10,
            createdAt: '2026-10-01T00:00:00.000Z',
          },
        },
      ]);

      mockedQueueApi.checkIn.mockResolvedValue({
        id: 'entry-new-1',
        menuId: 'menu-1',
        slotId: 'slot-1',
        bookingId: 'booking-1',
        studentId: 'student-1',
        entryType: EntryType.BOOKING,
        status: QueueStatus.CHECKED_IN,
        sequenceNumber: 25,
        studentIdentifier: 'CS2023001',
        checkedInAt: '2026-10-03T12:00:00.000Z',
        servingStartedAt: null,
        servedAt: null,
        createdAt: '2026-10-03T12:00:00.000Z',
        updatedAt: '2026-10-03T12:00:00.000Z',
      });

      renderWithClient(<StudentBookingPage />);

      const myBookingsTabBtn = screen.getByRole('button', { name: /My Bookings/i });
      await user.click(myBookingsTabBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Check In/i })).toBeDefined();
      });

      await user.click(screen.getByRole('button', { name: /Check In/i }));

      await waitFor(() => {
        expect(mockedQueueApi.checkIn).toHaveBeenCalledWith('booking-1');
      });
    });
  });
});
