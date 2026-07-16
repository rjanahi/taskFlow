-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('BACKLOG', 'ASSIGNED', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TimeExtensionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('ITEM_CREATED', 'ITEM_UPDATED', 'MEMBERS_ASSIGNED', 'MEMBERS_REASSIGNED', 'MEMBERS_REMOVED', 'WORK_STARTED', 'SUBMITTED_FOR_REVIEW', 'REVIEW_ACCEPTED', 'SENT_BACK', 'ITEM_CANCELLED', 'ITEM_REOPENED', 'STATUS_CHANGED', 'TIME_EXTENSION_REQUESTED', 'TIME_EXTENSION_APPROVED', 'TIME_EXTENSION_REJECTED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REPLACED', 'ATTACHMENT_REMOVED', 'RETURNED_TO_BACKLOG');

-- CreateTable
CREATE TABLE "work_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "WorkItemStatus" NOT NULL DEFAULT 'BACKLOG',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_item_assignments" (
    "workItemId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_item_assignments_pkey" PRIMARY KEY ("workItemId","memberId")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "fromStatus" "WorkItemStatus",
    "toStatus" "WorkItemStatus",
    "details" JSONB,
    "workItemId" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_extension_requests" (
    "id" TEXT NOT NULL,
    "currentDueDate" TIMESTAMP(3) NOT NULL,
    "proposedDueDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "TimeExtensionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "workItemId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_extension_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_items_status_idx" ON "work_items"("status");

-- CreateIndex
CREATE INDEX "work_items_priority_idx" ON "work_items"("priority");

-- CreateIndex
CREATE INDEX "work_items_dueDate_idx" ON "work_items"("dueDate");

-- CreateIndex
CREATE INDEX "work_items_createdById_idx" ON "work_items"("createdById");

-- CreateIndex
CREATE INDEX "work_items_status_dueDate_idx" ON "work_items"("status", "dueDate");

-- CreateIndex
CREATE INDEX "work_item_assignments_memberId_idx" ON "work_item_assignments"("memberId");

-- CreateIndex
CREATE INDEX "work_item_assignments_assignedById_idx" ON "work_item_assignments"("assignedById");

-- CreateIndex
CREATE INDEX "activities_workItemId_createdAt_idx" ON "activities"("workItemId", "createdAt");

-- CreateIndex
CREATE INDEX "activities_actorId_idx" ON "activities"("actorId");

-- CreateIndex
CREATE INDEX "time_extension_requests_workItemId_status_idx" ON "time_extension_requests"("workItemId", "status");

-- CreateIndex
CREATE INDEX "time_extension_requests_requestedById_idx" ON "time_extension_requests"("requestedById");

-- CreateIndex
CREATE INDEX "time_extension_requests_reviewedById_idx" ON "time_extension_requests"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_workItemId_key" ON "attachments"("workItemId");

-- CreateIndex
CREATE INDEX "attachments_uploadedById_idx" ON "attachments"("uploadedById");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_assignments" ADD CONSTRAINT "work_item_assignments_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_assignments" ADD CONSTRAINT "work_item_assignments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_item_assignments" ADD CONSTRAINT "work_item_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_extension_requests" ADD CONSTRAINT "time_extension_requests_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_extension_requests" ADD CONSTRAINT "time_extension_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_extension_requests" ADD CONSTRAINT "time_extension_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
