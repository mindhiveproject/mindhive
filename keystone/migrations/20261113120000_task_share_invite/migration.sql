-- Sharing a task, survey or block as an independent copy within a class.
CREATE TABLE "TaskShareInvite" (
    "id" TEXT NOT NULL,
    "sender" TEXT,
    "task" TEXT,
    "class" TEXT,
    "wholeClass" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "copies" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskShareInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_Profile_taskShareInvitesReceived" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);
CREATE TABLE "_Profile_taskShareInvitesAccepted" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);
CREATE TABLE "_Profile_taskShareInvitesDeclined" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);

CREATE INDEX "TaskShareInvite_sender_idx" ON "TaskShareInvite"("sender");
CREATE INDEX "TaskShareInvite_task_idx" ON "TaskShareInvite"("task");
CREATE INDEX "TaskShareInvite_class_idx" ON "TaskShareInvite"("class");

CREATE UNIQUE INDEX "_Profile_taskShareInvitesReceived_AB_unique" ON "_Profile_taskShareInvitesReceived"("A", "B");
CREATE INDEX "_Profile_taskShareInvitesReceived_B_index" ON "_Profile_taskShareInvitesReceived"("B");
CREATE UNIQUE INDEX "_Profile_taskShareInvitesAccepted_AB_unique" ON "_Profile_taskShareInvitesAccepted"("A", "B");
CREATE INDEX "_Profile_taskShareInvitesAccepted_B_index" ON "_Profile_taskShareInvitesAccepted"("B");
CREATE UNIQUE INDEX "_Profile_taskShareInvitesDeclined_AB_unique" ON "_Profile_taskShareInvitesDeclined"("A", "B");
CREATE INDEX "_Profile_taskShareInvitesDeclined_B_index" ON "_Profile_taskShareInvitesDeclined"("B");

ALTER TABLE "TaskShareInvite" ADD CONSTRAINT "TaskShareInvite_sender_fkey" FOREIGN KEY ("sender") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskShareInvite" ADD CONSTRAINT "TaskShareInvite_task_fkey" FOREIGN KEY ("task") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskShareInvite" ADD CONSTRAINT "TaskShareInvite_class_fkey" FOREIGN KEY ("class") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "_Profile_taskShareInvitesReceived" ADD CONSTRAINT "_Profile_taskShareInvitesReceived_A_fkey" FOREIGN KEY ("A") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_Profile_taskShareInvitesReceived" ADD CONSTRAINT "_Profile_taskShareInvitesReceived_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskShareInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_Profile_taskShareInvitesAccepted" ADD CONSTRAINT "_Profile_taskShareInvitesAccepted_A_fkey" FOREIGN KEY ("A") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_Profile_taskShareInvitesAccepted" ADD CONSTRAINT "_Profile_taskShareInvitesAccepted_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskShareInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_Profile_taskShareInvitesDeclined" ADD CONSTRAINT "_Profile_taskShareInvitesDeclined_A_fkey" FOREIGN KEY ("A") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_Profile_taskShareInvitesDeclined" ADD CONSTRAINT "_Profile_taskShareInvitesDeclined_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskShareInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
