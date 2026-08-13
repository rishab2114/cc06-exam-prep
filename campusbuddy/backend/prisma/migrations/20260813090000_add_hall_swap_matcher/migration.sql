-- Free, structured mutual hall-swap discovery. This does not transfer a room;
-- both residents must still use the university's official housing workflow.
CREATE TABLE "hall_swap_profiles" (
  "id" TEXT NOT NULL,
  "campusId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "gender" TEXT NOT NULL,
  "term" TEXT NOT NULL,
  "haveHall" TEXT NOT NULL,
  "haveRoomType" TEXT NOT NULL,
  "haveAircon" BOOLEAN NOT NULL,
  "wantedHalls" TEXT[],
  "wantedRoomTypes" TEXT[],
  "wantedAircon" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "hall_swap_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hall_swap_profiles_userId_key" ON "hall_swap_profiles"("userId");
CREATE INDEX "hall_swap_profiles_campusId_gender_term_isActive_idx"
  ON "hall_swap_profiles"("campusId", "gender", "term", "isActive");

ALTER TABLE "hall_swap_profiles"
  ADD CONSTRAINT "hall_swap_profiles_campusId_fkey"
  FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "hall_swap_profiles"
  ADD CONSTRAINT "hall_swap_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "HallSwapConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

CREATE TABLE "hall_swap_connections" (
  "id" TEXT NOT NULL,
  "campusId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "status" "HallSwapConnectionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "hall_swap_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hall_swap_connections_requesterId_recipientId_key"
  ON "hall_swap_connections"("requesterId", "recipientId");
CREATE INDEX "hall_swap_connections_recipientId_status_createdAt_idx"
  ON "hall_swap_connections"("recipientId", "status", "createdAt");

ALTER TABLE "hall_swap_connections"
  ADD CONSTRAINT "hall_swap_connections_campusId_fkey"
  FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hall_swap_connections"
  ADD CONSTRAINT "hall_swap_connections_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hall_swap_connections"
  ADD CONSTRAINT "hall_swap_connections_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
