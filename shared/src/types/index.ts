// ── Enums ─────────────────────────────────────────────────────

export enum Role {
  STUDENT = 'STUDENT',
  MESS_ADMIN = 'MESS_ADMIN',
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
}

export enum BookingStatus {
  BOOKED = 'BOOKED',
  CHECKED_IN = 'CHECKED_IN',
  WAITING = 'WAITING',
  SERVING = 'SERVING',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  WALK_IN = 'WALK_IN',
}

export enum EntryType {
  BOOKING = 'BOOKING',
  WALK_IN = 'WALK_IN',
}

// ── User ──────────────────────────────────────────────────────

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  rollNo: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

// ── API Response ──────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: Pagination;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
