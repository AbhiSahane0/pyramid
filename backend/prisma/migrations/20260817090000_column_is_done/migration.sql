-- Marks which columns mean "finished".
--
-- Nothing recorded this once columns became user-defined, so "overdue" and
-- "open" had no way to exclude work that is already done. It is a flag rather
-- than a name match because boards call that column whatever suits them.

ALTER TABLE "BoardColumn" ADD COLUMN "isDone" BOOLEAN NOT NULL DEFAULT false;

-- Backfill the shipped board: "Completed" is the column every existing
-- workspace was given for finished work. Names are matched case-insensitively
-- and only for the handful the app itself created, so a board that renamed it
-- keeps whatever it chose and can set the flag by hand.
UPDATE "BoardColumn"
SET "isDone" = true
WHERE lower("name") IN ('completed', 'done');
