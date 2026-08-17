-- Workspaces, memberships and magic-link invitations.
--
-- This migration moves ownership of projects and tasks from a single user to a
-- workspace. It is written by hand rather than generated, because the generated
-- version would DROP "ownerId" (losing the link between rows and people) and add
-- a NOT NULL "workspaceId" (which fails against any existing row).
--
-- The safe sequence is: add nullable -> backfill -> enforce NOT NULL.

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "workspaceId" TEXT NOT NULL,
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Membership_workspaceId_idx" ON "Membership"("workspaceId");
CREATE UNIQUE INDEX "Membership_userId_workspaceId_key" ON "Membership"("userId", "workspaceId");
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_workspaceId_idx" ON "Invitation"("workspaceId");
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Project / Task: ownerId becomes createdById (attribution), plus workspaceId
-- ---------------------------------------------------------------------------

-- Drop the old owner constraints and indexes first.
ALTER TABLE "Project" DROP CONSTRAINT "Project_ownerId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT "Task_ownerId_fkey";
DROP INDEX "Project_ownerId_idx";
DROP INDEX "Task_ownerId_status_position_idx";

-- RENAME rather than DROP+ADD, so the existing values survive.
ALTER TABLE "Project" RENAME COLUMN "ownerId" TO "createdById";
ALTER TABLE "Task" RENAME COLUMN "ownerId" TO "createdById";

-- Attribution is now optional: removing a user must not delete the team's work.
ALTER TABLE "Project" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "createdById" DROP NOT NULL;

-- Add the new scope column as NULLABLE so existing rows are still valid.
ALTER TABLE "Project" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Task" ADD COLUMN "workspaceId" TEXT;

-- ---------------------------------------------------------------------------
-- Backfill: give every real account a personal workspace and move its data in
-- ---------------------------------------------------------------------------

-- Temporary column carrying the owning user, so the rows just inserted can be
-- joined back to their user. Dropped at the end of this migration.
ALTER TABLE "Workspace" ADD COLUMN "_backfillUserId" TEXT;

-- Demo personas (isDemo) exist only to be assigned to tasks and can never sign
-- in, so they get no workspace.
INSERT INTO "Workspace" ("id", "name", "createdAt", "updatedAt", "_backfillUserId")
SELECT
  gen_random_uuid()::text,
  COALESCE(NULLIF(u."name", ''), 'My') || '''s Workspace',
  NOW(),
  NOW(),
  u."id"
FROM "User" u
WHERE u."isDemo" = false;

-- The account that owned the data becomes the workspace OWNER.
INSERT INTO "Membership" ("id", "userId", "workspaceId", "role", "createdAt")
SELECT gen_random_uuid()::text, w."_backfillUserId", w."id", 'OWNER', NOW()
FROM "Workspace" w
WHERE w."_backfillUserId" IS NOT NULL;

-- Point existing rows at their creator's new workspace.
UPDATE "Project" p
SET "workspaceId" = w."id"
FROM "Workspace" w
WHERE w."_backfillUserId" = p."createdById";

UPDATE "Task" t
SET "workspaceId" = w."id"
FROM "Workspace" w
WHERE w."_backfillUserId" = t."createdById";

ALTER TABLE "Workspace" DROP COLUMN "_backfillUserId";

-- ---------------------------------------------------------------------------
-- Enforce the new invariant
-- ---------------------------------------------------------------------------
-- If any row is still unscoped the backfill missed a case, and this migration
-- must fail loudly rather than leave the table half-migrated.
ALTER TABLE "Project" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "workspaceId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Project_workspaceId_idx" ON "Project"("workspaceId");
CREATE INDEX "Task_workspaceId_status_position_idx" ON "Task"("workspaceId", "status", "position");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
