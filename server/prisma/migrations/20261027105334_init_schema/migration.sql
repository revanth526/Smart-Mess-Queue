-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'MESS_ADMIN');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'CHECKED_IN', 'WAITING', 'SERVING', 'SERVED', 'CANCELLED', 'NO_SHOW', 'WALK_IN');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('BOOKING', 'WALK_IN');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('CHECKED_IN', 'WAITING', 'SERVING', 'SERVED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rollNo" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "totalCapacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "messes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_configs" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 20,
    "bookingCutoffMinutes" INTEGER NOT NULL DEFAULT 30,
    "cancellationCutoffMinutes" INTEGER NOT NULL DEFAULT 30,
    "defaultSlotCapacity" INTEGER NOT NULL DEFAULT 50,
    "averageServingTimeSeconds" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "meal_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "defaultServingGrams" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_dishes" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "dishName" TEXT NOT NULL,
    "dishCategory" TEXT,
    "servingGrams" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "slotId" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'BOOKED',
    "entryType" "EntryType" NOT NULL DEFAULT 'BOOKING',
    "bookedAt" TIMESTAMPTZ,
    "checkedInAt" TIMESTAMPTZ,
    "waitingAt" TIMESTAMPTZ,
    "servingAt" TIMESTAMPTZ,
    "servedAt" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    "noShowAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "slotId" TEXT,
    "bookingId" TEXT,
    "studentId" TEXT,
    "entryType" "EntryType" NOT NULL DEFAULT 'BOOKING',
    "status" "QueueStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "sequenceNumber" INTEGER NOT NULL,
    "studentIdentifier" TEXT,
    "checkedInAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "servingStartedAt" TIMESTAMPTZ,
    "servedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_logs" (
    "id" TEXT NOT NULL,
    "messId" TEXT NOT NULL,
    "menuId" TEXT,
    "date" DATE NOT NULL,
    "mealType" "MealType" NOT NULL,
    "preparedKg" DOUBLE PRECISION NOT NULL,
    "servedKg" DOUBLE PRECISION NOT NULL,
    "wastedKg" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "food_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_rollNo_key" ON "users"("rollNo");

-- CreateIndex
CREATE UNIQUE INDEX "meal_configs_messId_mealType_key" ON "meal_configs"("messId", "mealType");

-- CreateIndex
CREATE INDEX "menu_items_messId_isAvailable_idx" ON "menu_items"("messId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_messId_name_key" ON "menu_items"("messId", "name");

-- CreateIndex
CREATE INDEX "menus_date_mealType_idx" ON "menus"("date", "mealType");

-- CreateIndex
CREATE INDEX "menus_messId_date_idx" ON "menus"("messId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "menus_messId_date_mealType_key" ON "menus"("messId", "date", "mealType");

-- CreateIndex
CREATE INDEX "menu_dishes_menuId_idx" ON "menu_dishes"("menuId");

-- CreateIndex
CREATE INDEX "time_slots_menuId_idx" ON "time_slots"("menuId");

-- CreateIndex
CREATE INDEX "time_slots_menuId_startTime_idx" ON "time_slots"("menuId", "startTime");

-- CreateIndex
CREATE INDEX "bookings_menuId_status_idx" ON "bookings"("menuId", "status");

-- CreateIndex
CREATE INDEX "bookings_studentId_status_idx" ON "bookings"("studentId", "status");

-- CreateIndex
CREATE INDEX "bookings_menuId_entryType_idx" ON "bookings"("menuId", "entryType");

-- CreateIndex
CREATE INDEX "bookings_slotId_idx" ON "bookings"("slotId");

-- CreateIndex
CREATE INDEX "bookings_status_waitingAt_idx" ON "bookings"("status", "waitingAt");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_studentId_menuId_key" ON "bookings"("studentId", "menuId");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_bookingId_key" ON "queue_entries"("bookingId");

-- CreateIndex
CREATE INDEX "queue_entries_menuId_status_idx" ON "queue_entries"("menuId", "status");

-- CreateIndex
CREATE INDEX "queue_entries_studentId_status_idx" ON "queue_entries"("studentId", "status");

-- CreateIndex
CREATE INDEX "queue_entries_slotId_idx" ON "queue_entries"("slotId");

-- CreateIndex
CREATE INDEX "queue_entries_status_sequenceNumber_idx" ON "queue_entries"("status", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_menuId_sequenceNumber_key" ON "queue_entries"("menuId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "food_logs_messId_date_idx" ON "food_logs"("messId", "date");

-- CreateIndex
CREATE INDEX "food_logs_date_mealType_idx" ON "food_logs"("date", "mealType");

-- CreateIndex
CREATE INDEX "food_logs_menuId_idx" ON "food_logs"("menuId");

-- CreateIndex
CREATE INDEX "food_logs_createdById_idx" ON "food_logs"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "food_logs_messId_date_mealType_key" ON "food_logs"("messId", "date", "mealType");

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_bookingId_key" ON "feedbacks"("bookingId");

-- CreateIndex
CREATE INDEX "feedbacks_studentId_idx" ON "feedbacks"("studentId");

-- CreateIndex
CREATE INDEX "feedbacks_menuId_idx" ON "feedbacks"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_isRevoked_idx" ON "refresh_tokens"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "meal_configs" ADD CONSTRAINT "meal_configs_messId_fkey" FOREIGN KEY ("messId") REFERENCES "messes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_messId_fkey" FOREIGN KEY ("messId") REFERENCES "messes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_messId_fkey" FOREIGN KEY ("messId") REFERENCES "messes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "time_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_messId_fkey" FOREIGN KEY ("messId") REFERENCES "messes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
