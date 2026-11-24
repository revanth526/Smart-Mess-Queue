// ── Enums ─────────────────────────────────────────────────────

export const Role = Object.freeze({
  STUDENT: 'STUDENT',
  MESS_ADMIN: 'MESS_ADMIN',
});

export const MealType = Object.freeze({
  BREAKFAST: 'BREAKFAST',
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
});

export const BookingStatus = Object.freeze({
  BOOKED: 'BOOKED',
  CHECKED_IN: 'CHECKED_IN',
  WAITING: 'WAITING',
  SERVING: 'SERVING',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  WALK_IN: 'WALK_IN',
});

export const EntryType = Object.freeze({
  BOOKING: 'BOOKING',
  WALK_IN: 'WALK_IN',
});

export const QueueStatus = Object.freeze({
  CHECKED_IN: 'CHECKED_IN',
  WAITING: 'WAITING',
  SERVING: 'SERVING',
  SERVED: 'SERVED',
  NO_SHOW: 'NO_SHOW',
});
