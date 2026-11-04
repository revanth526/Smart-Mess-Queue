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

export enum QueueStatus {
  CHECKED_IN = 'CHECKED_IN',
  WAITING = 'WAITING',
  SERVING = 'SERVING',
  SERVED = 'SERVED',
  NO_SHOW = 'NO_SHOW',
}

// ── User ──────────────────────────────────────────────────────

export interface UserPublic {
  id: string;
  name: string;
  email: string | null;
  studentId?: string | null;
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

// ── Auth ─────────────────────────────────────────────────────

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
}

// ── Mess & Meal Config ───────────────────────────────────────

export interface Mess {
  id: string;
  name: string;
  location: string | null;
  totalCapacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealConfig {
  id: string;
  messId: string;
  mealType: MealType;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  bookingCutoffMinutes: number;
  cancellationCutoffMinutes: number;
  defaultSlotCapacity: number;
  averageServingTimeSeconds: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessConfigResponse {
  mess: Mess;
  mealConfigs: MealConfig[];
}

// ── Menu & Dishes ────────────────────────────────────────────

export interface MenuItem {
  id: string;
  messId: string;
  name: string;
  category: string | null;
  defaultServingGrams: number | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuDish {
  id: string;
  menuId: string;
  menuItemId: string | null;
  dishName: string;
  dishCategory: string | null;
  servingGrams: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  menuId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  currentBookings: number;
  createdAt: string;
}

export interface Menu {
  id: string;
  messId: string;
  date: string;
  mealType: MealType;
  createdAt: string;
  updatedAt: string;
  dishes?: MenuDish[];
  slots?: TimeSlot[];
}

// ── Booking ──────────────────────────────────────────────────

export interface Booking {
  id: string;
  studentId: string;
  menuId: string;
  slotId: string | null;
  status: BookingStatus;
  entryType: EntryType;
  bookedAt: string | null;
  checkedInAt: string | null;
  waitingAt: string | null;
  servingAt: string | null;
  servedAt: string | null;
  cancelledAt: string | null;
  noShowAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: UserPublic;
  menu?: Menu;
  slot?: TimeSlot | null;
  feedback?: Feedback | null;
}

// ── Queue ────────────────────────────────────────────────────

export interface QueueEntry {
  id: string;
  menuId: string;
  slotId: string | null;
  bookingId: string | null;
  studentId: string | null;
  entryType: EntryType;
  status: QueueStatus;
  sequenceNumber: number;
  studentIdentifier: string | null;
  checkedInAt: string;
  servingStartedAt: string | null;
  servedAt: string | null;
  createdAt: string;
  updatedAt: string;
  menu?: Menu;
  slot?: TimeSlot | null;
  student?: UserPublic | null;
  booking?: Booking | null;
  position?: number;
  aheadCount?: number;
}

export interface LiveQueueState {
  menuId: string;
  menu?: Menu;
  currentlyServing: QueueEntry[];
  waiting: QueueEntry[];
  checkedIn: QueueEntry[];
  servedCount: number;
  totalWaitingCount: number;
}

export interface StudentQueueStatus {
  hasActiveEntry: boolean;
  entry: QueueEntry | null;
  position: number | null;
  aheadCount: number | null;
  currentlyServingSequence: number | null;
  estimatedWaitMinutes: number | null;
}

// ── Food Waste Tracking & Analytics ──────────────────────────

export interface FoodLogContext {
  totalBookings: number;
  checkedInCount: number;
  servedCount: number;
  walkInCount: number;
}

export interface FoodLog {
  id: string;
  messId: string;
  menuId: string | null;
  date: string;
  mealType: MealType;
  preparedKg: number;
  servedKg: number;
  wastedKg: number;
  remainingKg: number;
  wastePercentage: number;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  mess?: Mess;
  menu?: Menu | null;
  createdBy?: UserPublic;
  context?: FoodLogContext;
}

export interface FoodWasteSummary {
  totalPreparedKg: number;
  totalServedKg: number;
  totalWastedKg: number;
  totalRemainingKg: number;
  wastePercentage: number;
  recordCount: number;
}

export interface MealWasteBreakdown {
  mealType: MealType;
  totalPreparedKg: number;
  totalServedKg: number;
  totalWastedKg: number;
  totalRemainingKg: number;
  wastePercentage: number;
  recordCount: number;
}

export interface DateWasteBreakdown {
  date: string;
  totalPreparedKg: number;
  totalServedKg: number;
  totalWastedKg: number;
  totalRemainingKg: number;
  wastePercentage: number;
  recordCount: number;
}

export interface FoodWasteAnalytics {
  summary: FoodWasteSummary;
  byMeal: MealWasteBreakdown[];
  byDate: DateWasteBreakdown[];
}

// ── Student Feedback & Ratings ─────────────────────────────────

export interface FeedbackStudentSummary {
  id: string;
  name: string;
  email: string | null;
  studentId?: string | null;
  rollNo: string | null;
}

export interface FeedbackMenuSummary {
  id: string;
  messId: string;
  date: string;
  mealType: MealType;
}

export interface Feedback {
  id: string;
  studentId: string;
  bookingId: string;
  menuId: string;
  rating: number; // 1 to 5 integer
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  student?: FeedbackStudentSummary | UserPublic;
  menu?: FeedbackMenuSummary | Menu;
  booking?: Booking;
}

export interface FeedbackRatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface MealFeedbackBreakdown {
  mealType: MealType;
  averageRating: number;
  feedbackCount: number;
}

export interface FeedbackAnalytics {
  totalCount: number;
  averageRating: number;
  distribution: FeedbackRatingDistribution;
  byMeal: MealFeedbackBreakdown[];
  recentFeedback: Feedback[];
}

export interface OperationalDashboardMetrics {
  todayMenusCount: number;
  totalBookings: number;
  checkedInCount: number;
  servingCount: number;
  servedCount: number;
  walkInCount: number;
  totalWaitingCount: number;
  foodPreparedKg: number;
  foodServedKg: number;
  foodWastedKg: number;
  wastePercentage: number;
  averageFeedbackRating: number;
  feedbackCount: number;
}
