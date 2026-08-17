-- Board columns become data instead of an enum, so a workspace can add
-- "Blocked" or "Future" without a schema change.
--
-- Written by hand: the generated version drops "Task"."status" and adds a
-- required "columnId", which would forget which column every existing task was
-- in. This creates the five shipped columns per workspace, points each task at
-- the one matching its old status, and only then enforces the constraint.

-- 1. The table.
CREATE TABLE "BoardColumn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'slate',
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardColumn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BoardColumn_workspaceId_name_key" ON "BoardColumn"("workspaceId", "name");
CREATE INDEX "BoardColumn_workspaceId_position_idx" ON "BoardColumn"("workspaceId", "position");

ALTER TABLE "BoardColumn"
    ADD CONSTRAINT "BoardColumn_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. One row per workspace per shipped status, keeping the order and the
--    colours the board already used. gen_random_uuid() is available in
--    Postgres 13+ without an extension.
INSERT INTO "BoardColumn" ("id", "name", "color", "position", "workspaceId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    seed.name,
    seed.color,
    seed.position,
    w."id",
    NOW(),
    NOW()
FROM "Workspace" w
CROSS JOIN (
    VALUES
        ('BACKLOG',   'Backlog',   'amber',   1000.0),
        ('TODO',      'To Do',     'slate',   2000.0),
        ('DOING',     'Doing',     'blue',    3000.0),
        ('COMPLETED', 'Completed', 'emerald', 4000.0),
        ('ON_HOLD',   'On Hold',   'orange',  5000.0)
) AS seed(status, name, color, position);

-- 3. Point every task at its workspace's matching column.
ALTER TABLE "Task" ADD COLUMN "columnId" TEXT;

UPDATE "Task" t
SET "columnId" = c."id"
FROM "BoardColumn" c
WHERE c."workspaceId" = t."workspaceId"
  AND c."name" = CASE t."status"::text
        WHEN 'BACKLOG'   THEN 'Backlog'
        WHEN 'TODO'      THEN 'To Do'
        WHEN 'DOING'     THEN 'Doing'
        WHEN 'COMPLETED' THEN 'Completed'
        WHEN 'ON_HOLD'   THEN 'On Hold'
      END;

-- Fail loudly rather than dropping work: if any task is still unassigned the
-- mapping above missed a case, and the transaction rolls back.
DO $$
DECLARE orphans INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphans FROM "Task" WHERE "columnId" IS NULL;
    IF orphans > 0 THEN
        RAISE EXCEPTION 'board column backfill missed % task(s)', orphans;
    END IF;
END $$;

ALTER TABLE "Task" ALTER COLUMN "columnId" SET NOT NULL;

ALTER TABLE "Task"
    ADD CONSTRAINT "Task_columnId_fkey"
    FOREIGN KEY ("columnId") REFERENCES "BoardColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Retire the enum column and the index built on it.
DROP INDEX IF EXISTS "Task_workspaceId_status_position_idx";
CREATE INDEX "Task_workspaceId_columnId_position_idx" ON "Task"("workspaceId", "columnId", "position");

ALTER TABLE "Task" DROP COLUMN "status";
DROP TYPE "TaskStatus";
