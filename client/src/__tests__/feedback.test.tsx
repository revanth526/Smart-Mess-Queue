import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import StudentBookingPage from '../pages/StudentBookingPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { Role, MealType, BookingStatus, EntryType, Booking } from '@shared/types';
import { feedbackApi } from '../api/feedback';
import { bookingApi } from '../api/booking';

let mockUserRole: Role = Role.STUDENT;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: mockUserRole === Role.STUDENT ? 'student-1' : 'admin-1',
      name: mockUserRole === Role.STUDENT ? 'Test Student' : 'Admin User',
      email: mockUserRole === Role.STUDENT ? 'student@example.com' : 'admin@example.com',
      rollNo: mockUserRole === Role.STUDENT ? 'CS2023001' : null,
      role: mockUserRole,
    },
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../api/feedback', () => ({
  feedbackApi: {
    submitFeedback: vi.fn(),
    updateFeedback: vi.fn(),
    getMyFeedback: vi.fn(),
    getFeedbackById: vi.fn(),
    getAdminFeedback: vi.fn(),
    getAnalytics: vi.fn(),
    getOperationalMetrics: vi.fn(),
  },
}));

vi.mock('../api/booking', () => ({
  bookingApi: {
    listAvailableMenus: vi.fn(),
    listMyBookings: vi.fn(),
    createBooking: vi.fn(),
    cancelBooking: vi.fn(),
    getBooking: vi.fn(),
  },
}));

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

vi.mock('../api/admin', () => ({
  adminApi: {
    getMessConfig: vi.fn().mockResolvedValue({ id: 'mess-1', name: 'Central Mess' }),
    listMenuItems: vi.fn().mockResolvedValue([]),
    listMenus: vi.fn().mockResolvedValue([]),
    getTimeSlots: vi.fn().mockResolvedValue([]),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Phase 6 Client — Student Feedback & Dashboards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRole = Role.STUDENT;
  });

  describe('FeedbackModal component', () => {
    it('renders star rating and comment form', () => {
      renderWithClient(
        <FeedbackModal
          isOpen={true}
          onClose={vi.fn()}
          bookingId="b-1"
          mealContextText="Lunch • Oct 6, 2026"
        />,
      );

      expect(screen.getByText('Rate Your Meal')).toBeInTheDocument();
      expect(screen.getByText('Lunch • Oct 6, 2026')).toBeInTheDocument();
      expect(screen.getByText('Your Rating (1 to 5 Stars)')).toBeInTheDocument();
      expect(screen.getByLabelText('5 stars')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/how was the food quality/i)).toBeInTheDocument();
    });

    it('submits rating and comment successfully', async () => {
      const user = userEvent.setup();
      const mockClose = vi.fn();
      vi.mocked(feedbackApi.submitFeedback).mockResolvedValue({
        id: 'f-1',
        studentId: 'student-1',
        bookingId: 'b-1',
        menuId: 'm-1',
        rating: 4,
        comment: 'Great lunch!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      renderWithClient(
        <FeedbackModal
          isOpen={true}
          onClose={mockClose}
          bookingId="b-1"
          mealContextText="Lunch • Oct 6, 2026"
        />,
      );

      // Click 4 stars
      const fourStarBtn = screen.getByLabelText('4 stars');
      await user.click(fourStarBtn);

      // Type comment
      const commentInput = screen.getByPlaceholderText(/how was the food quality/i);
      await user.type(commentInput, 'Great lunch!');

      // Click submit
      const submitBtn = screen.getByRole('button', { name: /submit feedback/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(feedbackApi.submitFeedback).toHaveBeenCalledWith({
          bookingId: 'b-1',
          rating: 4,
          comment: 'Great lunch!',
        });
        expect(mockClose).toHaveBeenCalled();
      });
    });

    it('pre-populates existing feedback in edit mode', () => {
      renderWithClient(
        <FeedbackModal
          isOpen={true}
          onClose={vi.fn()}
          bookingId="b-1"
          mealContextText="Dinner • Oct 5, 2026"
          existingFeedback={{
            id: 'f-existing',
            studentId: 'student-1',
            bookingId: 'b-1',
            menuId: 'm-1',
            rating: 3,
            comment: 'Needs more salt',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
        />,
      );

      expect(screen.getByText('Edit Meal Feedback')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Needs more salt')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update feedback/i })).toBeInTheDocument();
    });
  });

  describe('Student Dashboard Feedback Integration', () => {
    it('shows Rate Meal button on SERVED booking in My Bookings', async () => {
      const user = userEvent.setup();
      const servedBooking = {
        id: 'booking-served-1',
        studentId: 'student-1',
        menuId: 'menu-1',
        slotId: 'slot-1',
        status: BookingStatus.SERVED,
        entryType: EntryType.BOOKING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        menu: {
          id: 'menu-1',
          messId: 'mess-1',
          date: '2026-10-06T00:00:00.000Z',
          mealType: MealType.LUNCH,
          dishes: [{ id: 'd-1', dishName: 'Paneer Butter Masala' }],
        },
        slot: {
          id: 'slot-1',
          startTime: '2026-10-06T12:00:00.000Z',
          endTime: '2026-10-06T12:30:00.000Z',
        },
        feedback: null,
      };

      vi.mocked(bookingApi.listAvailableMenus).mockResolvedValue([]);
      vi.mocked(bookingApi.listMyBookings).mockResolvedValue([servedBooking as unknown as Booking]);

      renderWithClient(<StudentBookingPage />);

      // Switch to My Bookings tab
      const myBookingsTab = screen.getByRole('button', { name: /my bookings/i });
      await user.click(myBookingsTab);

      // Verify SERVED booking has Rate Meal button
      await waitFor(() => {
        expect(screen.getByText(BookingStatus.SERVED)).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /rate meal/i }).length).toBeGreaterThanOrEqual(
          1,
        );
      });

      // Clicking Rate Meal opens feedback modal
      await user.click(screen.getAllByRole('button', { name: /rate meal/i })[0]);
      expect(screen.getByText('Rate Your Meal')).toBeInTheDocument();
    });

    it('shows submitted rating and Edit Rating button when feedback exists', async () => {
      const ratedBooking = {
        id: 'booking-rated-1',
        studentId: 'student-1',
        menuId: 'menu-1',
        slotId: 'slot-1',
        status: BookingStatus.SERVED,
        entryType: EntryType.BOOKING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        menu: {
          id: 'menu-1',
          messId: 'mess-1',
          date: '2026-10-06T00:00:00.000Z',
          mealType: MealType.LUNCH,
          dishes: [],
        },
        slot: {
          id: 'slot-1',
          startTime: '2026-10-06T12:00:00.000Z',
          endTime: '2026-10-06T12:30:00.000Z',
        },
        feedback: {
          id: 'fb-1',
          studentId: 'student-1',
          bookingId: 'booking-rated-1',
          menuId: 'menu-1',
          rating: 5,
          comment: 'Perfect taste!',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      vi.mocked(bookingApi.listAvailableMenus).mockResolvedValue([]);
      vi.mocked(bookingApi.listMyBookings).mockResolvedValue([ratedBooking as unknown as Booking]);

      const user = userEvent.setup();
      renderWithClient(<StudentBookingPage />);

      await user.click(screen.getByRole('button', { name: /my bookings/i }));

      await waitFor(() => {
        expect(screen.getByText('(5/5)')).toBeInTheDocument();
        expect(screen.getByText('"Perfect taste!"')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /edit rating/i })).toBeInTheDocument();
      });
    });
  });

  describe('Admin Dashboard Feedback & Operational Overview', () => {
    beforeEach(() => {
      mockUserRole = Role.MESS_ADMIN;
    });

    it('renders operational overview metrics and feedback tab', async () => {
      vi.mocked(feedbackApi.getOperationalMetrics).mockResolvedValue({
        todayMenusCount: 2,
        totalBookings: 150,
        checkedInCount: 40,
        servingCount: 10,
        servedCount: 95,
        walkInCount: 15,
        totalWaitingCount: 5,
        foodPreparedKg: 200,
        foodServedKg: 180,
        foodWastedKg: 16,
        wastePercentage: 8,
        averageFeedbackRating: 4.4,
        feedbackCount: 52,
      });

      vi.mocked(feedbackApi.getAnalytics).mockResolvedValue({
        totalCount: 52,
        averageRating: 4.4,
        distribution: { 1: 1, 2: 2, 3: 5, 4: 20, 5: 24 },
        byMeal: [
          { mealType: MealType.LUNCH, averageRating: 4.5, feedbackCount: 30 },
          { mealType: MealType.DINNER, averageRating: 4.2, feedbackCount: 22 },
        ],
        recentFeedback: [],
      });

      vi.mocked(feedbackApi.getAdminFeedback).mockResolvedValue([
        {
          id: 'f-admin-1',
          studentId: 's-1',
          bookingId: 'b-1',
          menuId: 'm-1',
          rating: 5,
          comment: 'Outstanding food quality!',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          student: {
            id: 's-1',
            name: 'Alice Smith',
            email: 'alice@example.com',
            rollNo: 'CS001',
          },
          menu: {
            id: 'm-1',
            messId: 'mess-1',
            date: '2026-10-06',
            mealType: MealType.LUNCH,
          },
        },
      ]);

      const user = userEvent.setup();
      renderWithClient(<AdminDashboardPage />);

      // Operational KPI bar assertions
      await waitFor(() => {
        expect(screen.getByText("Today's Bookings")).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('8%')).toBeInTheDocument();
        expect(screen.getByText('4.4')).toBeInTheDocument();
      });

      // Switch to Student Feedback tab
      const feedbackTabBtn = screen.getByRole('button', { name: /student feedback & ratings/i });
      await user.click(feedbackTabBtn);

      await waitFor(() => {
        expect(screen.getByText('Average Meal Rating')).toBeInTheDocument();
        expect(screen.getByText('Rating Distribution')).toBeInTheDocument();
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Outstanding food quality!')).toBeInTheDocument();
      });
    });
  });
});
