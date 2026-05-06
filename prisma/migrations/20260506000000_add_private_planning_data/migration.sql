-- CreateTable
CREATE TABLE "PrivatePlanningData" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivatePlanningData_pkey" PRIMARY KEY ("id")
);
