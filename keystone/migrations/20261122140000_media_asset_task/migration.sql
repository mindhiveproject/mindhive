-- Media library images in tasks (Survey Builder text blocks): the task an
-- image was uploaded from, and the tasks whose content shows it.
ALTER TABLE "MediaAsset" ADD COLUMN "createdInTask" TEXT;
CREATE INDEX "MediaAsset_createdInTask_idx" ON "MediaAsset"("createdInTask");
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdInTask_fkey" FOREIGN KEY ("createdInTask") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "_MediaAsset_usedInTasks" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);
CREATE UNIQUE INDEX "_MediaAsset_usedInTasks_AB_unique" ON "_MediaAsset_usedInTasks"("A", "B");
CREATE INDEX "_MediaAsset_usedInTasks_B_index" ON "_MediaAsset_usedInTasks"("B");
ALTER TABLE "_MediaAsset_usedInTasks" ADD CONSTRAINT "_MediaAsset_usedInTasks_A_fkey" FOREIGN KEY ("A") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_MediaAsset_usedInTasks" ADD CONSTRAINT "_MediaAsset_usedInTasks_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
