import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import {
  useAvailableMenus,
  useMyBookings,
  useCreateBooking,
  useCancelBooking,
} from '../hooks/useBookings.js';
import { useCheckIn, useMyQueue, useMarkWaiting, useLiveQueue } from '../hooks/useQueue.js';
import { BookingStatus, MealType, QueueStatus } from '@shared/types';
import { FeedbackModal } from '../components/feedback/FeedbackModal.jsx';
import { SmartMessLogo } from '../components/common/SmartMessLogo.jsx';

export default function StudentBookingPage() {
  const { user, logout } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState('browse');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackModalBooking, setFeedbackModalBooking] = useState(null);

  const {
    data: menus,
    isLoading: loadingMenus,
    error: menuError,
  } = useAvailableMenus({
    date: selectedDate,
  });

  const { data: myBookings, isLoading: loadingBookings } = useMyBookings();
  const createBookingMutation = useCreateBooking();
  const cancelBookingMutation = useCancelBooking();

  // Queue state and mutations.
  const { data: myQueueData } = useMyQueue();
  const checkInMutation = useCheckIn();
  const markWaitingMutation = useMarkWaiting();

  // Active menu for live queue board — only compute after data is available
  const liveMenuId = myQueueData?.entry?.menuId || (menus && menus.length > 0 ? menus[0].id : undefined);

  // Only fetch the live queue board when the student is on the live-queue tab
  const { data: liveQueueBoard } = useLiveQueue(
    activeTab === 'live-queue' ? liveMenuId : undefined,
  );

  // Determine which menus the student already booked actively
  const activeStatuses = [
    BookingStatus.BOOKED,
    BookingStatus.CHECKED_IN,
    BookingStatus.WAITING,
    BookingStatus.SERVING,
    BookingStatus.SERVED,
    'COMPLETED',
  ];
  const activeBookedMenuIds = new Set(
    myBookings?.filter((b) => activeStatuses.includes(b.status)).map((b) => b.menuId),
  );

  const handleBookSlot = async (menuId, slotId) => {
    setFeedback(null);
    try {
      await createBookingMutation.mutateAsync({ menuId, slotId });
      setSelectedSlotId(null);
      setSelectedMenuId(null);
      setFeedback({ type: 'success', message: 'Meal slot booked successfully!' });
      setActiveTab('my-bookings');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to book slot');
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleCheckIn = async (bookingId) => {
    setFeedback(null);
    try {
      await checkInMutation.mutateAsync(bookingId);
      setFeedback({ type: 'success', message: 'Checked in successfully! You are now in line.' });
      setActiveTab('live-queue');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to check in');
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleJoinWaitingLine = async (entryId) => {
    setFeedback(null);
    try {
      await markWaitingMutation.mutateAsync(entryId);
      setFeedback({ type: 'success', message: 'You have entered the waiting line!' });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to join line');
      setFeedback({ type: 'error', message: msg });
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setFeedback(null);
    try {
      await cancelBookingMutation.mutateAsync(bookingId);
      setFeedback({ type: 'success', message: 'Booking cancelled successfully.' });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to cancel booking');
      setFeedback({ type: 'error', message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SmartMessLogo size="sm" variant="icon-only" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Smart Mess Portal</h1>
              <p className="text-xs text-gray-500">Student Dining & Meal Booking</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-medium text-gray-900">{user?.name}</span>
              <span className="block text-xs text-gray-500">
                {user?.rollNo ? `Roll No: ${user.rollNo}` : user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Student Quick Status & Alerts */}
        <div className="mb-6 space-y-3">
          {/* Active Queue Alert */}
          {myQueueData?.hasActiveEntry && myQueueData.entry && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
                  #{myQueueData.entry.sequenceNumber}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">
                    You are in the dining queue!
                  </h3>
                  <p className="text-xs text-indigo-700">
                    Status:{' '}
                    <span className="font-semibold uppercase">{myQueueData.entry.status}</span> •
                    Estimated wait: {myQueueData.estimatedWaitMinutes ?? 0} mins
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('live-queue')}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors self-start sm:self-auto"
              >
                Track Live Queue →
              </button>
            </div>
          )}

          {/* Pending Feedback Prompt */}
          {(() => {
            const unratedCheckedIn = myBookings?.find(
              (b) =>
                [BookingStatus.CHECKED_IN, BookingStatus.WAITING, BookingStatus.SERVING, BookingStatus.SERVED, 'COMPLETED'].includes(b.status) &&
                !b.feedback,
            );
            if (!unratedCheckedIn) return null;
            return (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-lg text-white">
                    ★
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">How was your recent meal?</h3>
                    <p className="text-xs text-amber-800">
                      Share your rating and feedback for{' '}
                      {unratedCheckedIn.menu?.mealType || 'your meal'} to help optimize future food
                      quality!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedbackModalBooking(unratedCheckedIn)}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors self-start sm:self-auto"
                >
                  Rate Meal Now ★
                </button>
              </div>
            );
          })()}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'browse'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Book Meals
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'my-bookings'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              My Bookings
              {myBookings &&
                myBookings.filter((b) => b.status === BookingStatus.BOOKED).length > 0 && (
                  <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {myBookings.filter((b) => b.status === BookingStatus.BOOKED).length}
                  </span>
                )}
            </button>
            <button
              onClick={() => setActiveTab('live-queue')}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'live-queue'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Live Queue
              {myQueueData?.hasActiveEntry && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  #{myQueueData.entry?.sequenceNumber}
                </span>
              )}
            </button>
          </nav>
        </div>

        {feedback && (
          <div
            className={`mb-6 rounded-md p-4 text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Tab 1: Browse & Book */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
              <label htmlFor="service-date-select" className="text-sm font-medium text-gray-700">
                Select Date:
              </label>
              <input
                id="service-date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {loadingMenus ? (
              <div className="py-12 text-center text-gray-500">Loading daily menus...</div>
            ) : menuError ? (
              <div className="py-12 text-center text-red-500">
                Failed to load menus. Please try again.
              </div>
            ) : menus && menus.length > 0 ? (
              <div className="space-y-6">
                {menus.map((menu) => {
                  const hasActiveBooking = activeBookedMenuIds.has(menu.id);

                  return (
                    <div
                      key={menu.id}
                      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase ${
                              menu.mealType === MealType.BREAKFAST
                                ? 'bg-amber-100 text-amber-800'
                                : menu.mealType === MealType.LUNCH
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {menu.mealType}
                          </span>
                          <h2 className="text-base font-semibold text-gray-900">
                            {new Date(menu.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </h2>
                        </div>
                        {hasActiveBooking && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
                            ✓ You have an active booking for this meal
                          </span>
                        )}
                      </div>

                      {/* Dishes in this meal */}
                      <div className="mt-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                          Menu Dishes
                        </h3>
                        {menu.dishes && menu.dishes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {menu.dishes.map((dish) => (
                              <span
                                key={dish.id}
                                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                              >
                                {dish.dishName}
                                {dish.dishCategory && (
                                  <span className="ml-1 text-gray-400">({dish.dishCategory})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Dishes not listed yet.</p>
                        )}
                      </div>

                      {/* Time Slots Selection */}
                      <div className="mt-6 border-t border-gray-100 pt-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                          Select a Dining Time Slot
                        </h3>
                        {menu.slots && menu.slots.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {menu.slots.map((slot) => {
                              const remaining = Math.max(0, slot.capacity - slot.currentBookings);
                              const isFull = remaining === 0;
                              const now = new Date();
                              const slotDate = new Date(slot.startTime);
                              const rawDiff = slotDate.getTime() - now.getTime();
                              const effectiveDiff =
                                rawDiff > 4 * 3600 * 1000 && rawDiff < 8 * 3600 * 1000
                                  ? rawDiff - 5.5 * 3600 * 1000
                                  : rawDiff;
                              const isPast = effectiveDiff <= 0;
                              const isSelected =
                                selectedSlotId === slot.id && selectedMenuId === menu.id;

                              const startTimeFormatted = new Date(
                                slot.startTime,
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              });
                              const endTimeFormatted = new Date(slot.endTime).toLocaleTimeString(
                                [],
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                },
                              );

                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  disabled={isFull || isPast || hasActiveBooking}
                                  onClick={() => {
                                    setSelectedSlotId(slot.id);
                                    setSelectedMenuId(menu.id);
                                  }}
                                  className={`rounded-lg border p-3 text-left transition-all ${
                                    isSelected
                                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600'
                                      : isFull || isPast || hasActiveBooking
                                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                                  }`}
                                >
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {startTimeFormatted} – {endTimeFormatted}
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-xs">
                                    <span
                                      className={`font-medium ${
                                        isFull
                                          ? 'text-red-600'
                                          : remaining <= 5
                                            ? 'text-amber-600'
                                            : 'text-emerald-600'
                                      }`}
                                    >
                                      {isFull ? 'Full' : `${remaining} seats left`}
                                    </span>
                                    <span className="text-gray-400">Total: {slot.capacity}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            No slots available for this meal.
                          </p>
                        )}
                      </div>

                      {/* Confirm Booking Action */}
                      {selectedMenuId === menu.id && selectedSlotId && (
                        <div className="mt-6 flex items-center justify-between rounded-lg bg-indigo-50 p-4 border border-indigo-200">
                          <div>
                            <span className="text-sm font-semibold text-indigo-900">
                              Slot Selected
                            </span>
                            <p className="text-xs text-indigo-700">
                              Click Confirm to reserve your seat.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleBookSlot(menu.id, selectedSlotId)}
                              disabled={createBookingMutation.isPending}
                              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              Confirm Booking
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSlotId(null);
                                setSelectedMenuId(null);
                              }}
                              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500 bg-white">
                No meal services scheduled for {selectedDate}.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Bookings */}
        {activeTab === 'my-bookings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Meal Bookings</h2>

            {loadingBookings ? (
              <div className="py-12 text-center text-gray-500">Loading your bookings...</div>
            ) : myBookings && myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map((b) => {
                  const isBooked = b.status === BookingStatus.BOOKED;

                  const slotStartFormatted = b.slot
                    ? new Date(b.slot.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })
                    : '—';
                  const slotEndFormatted = b.slot
                    ? new Date(b.slot.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })
                    : '—';

                  return (
                    <div
                      key={b.id}
                      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                              b.menu?.mealType === MealType.BREAKFAST
                                ? 'bg-amber-100 text-amber-800'
                                : b.menu?.mealType === MealType.LUNCH
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {b.menu?.mealType}
                          </span>
                          <span className="font-semibold text-gray-900 text-sm">
                            {b.menu?.date
                              ? new Date(b.menu.date).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              isBooked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        <div className="text-xs text-gray-600">
                          Time Slot:{' '}
                          <span className="font-semibold text-gray-900">
                            {slotStartFormatted} – {slotEndFormatted}
                          </span>
                        </div>

                        {b.menu?.dishes && b.menu.dishes.length > 0 && (
                          <div className="text-xs text-gray-500 pt-1">
                            Dishes:{' '}
                            <span className="text-gray-700">
                              {b.menu.dishes.map((d) => d.dishName).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {isBooked && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCheckIn(b.id)}
                            disabled={checkInMutation.isPending}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {checkInMutation.isPending ? 'Checking in...' : 'Check In'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(b.id)}
                            disabled={cancelBookingMutation.isPending}
                            className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-400 disabled:opacity-50"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      )}

                      {[BookingStatus.CHECKED_IN, BookingStatus.WAITING, BookingStatus.SERVING, BookingStatus.SERVED, 'COMPLETED'].includes(b.status) && (
                        <div className="flex flex-col sm:items-end gap-1.5">
                          {b.feedback ? (
                            <div className="flex items-center gap-2.5">
                              <div className="text-left sm:text-right">
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                  <span>★</span>
                                  <span>Rated {b.feedback.rating}/5</span>
                                  <span className="text-amber-500 font-bold">{'★'.repeat(b.feedback.rating)}</span>
                                  <span className="text-gray-500 font-medium">
                                    ({b.feedback.rating}/5)
                                  </span>
                                </span>
                                {b.feedback.comment && (
                                  <p className="text-[11px] text-gray-500 italic max-w-xs truncate mt-0.5">
                                    "{b.feedback.comment}"
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setFeedbackModalBooking(b)}
                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                                aria-label="Edit Rating"
                              >
                                Edit Rating
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setFeedbackModalBooking(b)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-600 transition-colors"
                            >
                              <span>★</span>
                              <span>Rate Meal</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500 bg-white">
                You have no meal bookings yet. Switch to "Book Meals" to reserve a time slot!
              </div>
            )}
          </div>
        )}

        {/* Live Queue Tab */}
        {activeTab === 'live-queue' && (
          <div className="space-y-6">
            {/* Student's Personal Ticket */}
            {myQueueData?.hasActiveEntry && myQueueData.entry ? (
              <div className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-md">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">
                        Your Live Dining Ticket
                      </span>
                      <h3 className="text-2xl font-black mt-1">
                        Queue Ticket #{myQueueData.entry.sequenceNumber}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        myQueueData.entry.status === QueueStatus.SERVING
                          ? 'bg-emerald-400 text-emerald-950 animate-pulse'
                          : myQueueData.entry.status === QueueStatus.WAITING
                            ? 'bg-amber-300 text-amber-950'
                            : 'bg-white text-indigo-900'
                      }`}
                    >
                      {myQueueData.entry.status === QueueStatus.SERVING
                        ? 'NOW SERVING'
                        : myQueueData.entry.status === QueueStatus.WAITING
                          ? 'WAITING IN LINE'
                          : myQueueData.entry.status}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {myQueueData.entry.status === QueueStatus.CHECKED_IN && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
                      <p className="text-base font-semibold text-blue-900">✓ Check-in Verified!</p>
                      <p className="mt-1 text-sm text-blue-700">
                        When you are ready to receive food at the counter, click below to join the
                        active waiting line.
                      </p>
                      <button
                        onClick={() => handleJoinWaitingLine(myQueueData.entry.id)}
                        disabled={markWaitingMutation.isPending}
                        className="mt-4 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {markWaitingMutation.isPending ? 'Entering line...' : 'Join Waiting Line'}
                      </button>
                    </div>
                  )}

                  {myQueueData.entry.status === QueueStatus.WAITING && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-center">
                      <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                        <span className="text-xs font-medium text-amber-700">
                          Your Position in Line
                        </span>
                        <div className="mt-1 text-3xl font-extrabold text-amber-900">
                          #{myQueueData.position}
                        </div>
                        <p className="text-xs text-amber-600 mt-1">
                          {myQueueData.aheadCount === 0
                            ? 'You are next in line!'
                            : `${myQueueData.aheadCount} student(s) ahead of you`}
                        </p>
                      </div>

                      <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-200">
                        <span className="text-xs font-medium text-indigo-700">
                          Currently Serving
                        </span>
                        <div className="mt-1 text-3xl font-extrabold text-indigo-900">
                          {myQueueData.currentlyServingSequence
                            ? `#${myQueueData.currentlyServingSequence}`
                            : '—'}
                        </div>
                        <p className="text-xs text-indigo-600 mt-1">Active ticket at counter</p>
                      </div>

                      <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                        <span className="text-xs font-medium text-emerald-700">Estimated Wait</span>
                        <div className="mt-1 text-3xl font-extrabold text-emerald-900">
                          ~{myQueueData.estimatedWaitMinutes || 1} min
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">
                          Calculated from prep & service rate
                        </p>
                      </div>
                    </div>
                  )}

                  {myQueueData.entry.status === QueueStatus.SERVING && (
                    <div className="rounded-lg bg-emerald-500 p-6 text-center text-white shadow-lg animate-pulse">
                      <h4 className="text-2xl font-black">
                        🎉 Now Serving Ticket #{myQueueData.entry.sequenceNumber}!
                      </h4>
                      <p className="mt-1 text-sm font-medium text-emerald-100">
                        Please proceed to the food service counter to collect your meal plate.
                      </p>
                    </div>
                  )}

                  {myQueueData.entry.status === QueueStatus.SERVED && (
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center">
                      <p className="text-sm font-bold text-gray-800">✓ Meal Served</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Thank you for dining with Smart Mess!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500 shadow-sm">
                <p className="font-semibold text-gray-700">No Active Queue Ticket</p>
                <p className="mt-1 text-xs text-gray-500">
                  Switch to "My Bookings" and click "Check In" on your booked meal when you arrive
                  at the dining hall.
                </p>
              </div>
            )}

            {/* Public Live Queue Board */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Dining Hall Queue Status</h3>
                  <p className="text-xs text-gray-500">Real-time live counter updates</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Live Updates Active
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
                  <span className="text-xs font-semibold text-indigo-700 uppercase">
                    Now Serving
                  </span>
                  <div className="mt-2 text-2xl font-black text-indigo-900">
                    {liveQueueBoard?.currentlyServing && liveQueueBoard.currentlyServing.length > 0
                      ? liveQueueBoard.currentlyServing
                          .map((s) => `#${s.sequenceNumber}`)
                          .join(', ')
                      : 'None (Counter Free)'}
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                  <span className="text-xs font-semibold text-amber-700 uppercase">
                    Students in Line
                  </span>
                  <div className="mt-2 text-2xl font-black text-amber-900">
                    {liveQueueBoard?.totalWaitingCount || 0}
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                  <span className="text-xs font-semibold text-emerald-700 uppercase">
                    Meals Served Today
                  </span>
                  <div className="mt-2 text-2xl font-black text-emerald-900">
                    {liveQueueBoard?.servedCount || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Student Feedback Dialog */}
        {feedbackModalBooking && (
          <FeedbackModal
            isOpen={Boolean(feedbackModalBooking)}
            onClose={() => setFeedbackModalBooking(null)}
            bookingId={feedbackModalBooking.id}
            menuId={feedbackModalBooking.menuId || feedbackModalBooking.menu?.id}
            mealType={feedbackModalBooking.menu?.mealType}
            mealContextText={`${feedbackModalBooking.menu?.mealType || 'Meal'} • ${
              feedbackModalBooking.menu?.date
                ? new Date(feedbackModalBooking.menu.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Completed Meal'
            }`}
            existingFeedback={feedbackModalBooking.feedback}
            onSuccess={() => {
              setFeedback({
                type: 'success',
                message: 'Thank you! Your meal feedback has been recorded.',
              });
            }}
          />
        )}
      </main>
    </div>
  );
}

