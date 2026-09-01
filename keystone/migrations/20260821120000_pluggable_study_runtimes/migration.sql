-- Add the Task-resolved runtime model without rewriting Study.flow or results.
CREATE TYPE "TaskRuntimeTypeType" AS ENUM ('LABJS', 'P5', 'JSPSYCH');

ALTER TABLE "Template"
  ADD COLUMN "docs" JSONB,
  ADD COLUMN "version" TEXT NOT NULL DEFAULT '1',
  ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Visual"
  ADD COLUMN "version" TEXT NOT NULL DEFAULT '1';

CREATE TABLE "JsPsychExperiment" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "author" TEXT,
  "archive_filesize" INTEGER,
  "archive_filename" TEXT,
  "manifest" JSONB,
  "entryPoint" TEXT NOT NULL DEFAULT '',
  "version" TEXT NOT NULL DEFAULT '1',
  "parameters" JSONB DEFAULT '[]',
  "docs" JSONB,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "privacy" TEXT NOT NULL DEFAULT 'private',
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JsPsychExperiment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JsPsychExperiment_author_idx" ON "JsPsychExperiment"("author");
ALTER TABLE "JsPsychExperiment"
  ADD CONSTRAINT "JsPsychExperiment_author_fkey"
  FOREIGN KEY ("author") REFERENCES "Profile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "_JsPsychExperiment_collaborators" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);
CREATE UNIQUE INDEX "_JsPsychExperiment_collaborators_AB_unique"
  ON "_JsPsychExperiment_collaborators"("A", "B");
CREATE INDEX "_JsPsychExperiment_collaborators_B_index"
  ON "_JsPsychExperiment_collaborators"("B");
ALTER TABLE "_JsPsychExperiment_collaborators"
  ADD CONSTRAINT "_JsPsychExperiment_collaborators_A_fkey"
  FOREIGN KEY ("A") REFERENCES "JsPsychExperiment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_JsPsychExperiment_collaborators"
  ADD CONSTRAINT "_JsPsychExperiment_collaborators_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Profile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task"
  ADD COLUMN "runtimeType" "TaskRuntimeTypeType" NOT NULL DEFAULT 'LABJS',
  ADD COLUMN "visual" TEXT,
  ADD COLUMN "jsPsychExperiment" TEXT,
  ADD COLUMN "aggregateVariables" JSONB;
CREATE INDEX "Task_visual_idx" ON "Task"("visual");
CREATE INDEX "Task_jsPsychExperiment_idx" ON "Task"("jsPsychExperiment");
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_visual_fkey"
  FOREIGN KEY ("visual") REFERENCES "Visual"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task"
  ADD CONSTRAINT "Task_jsPsychExperiment_fkey"
  FOREIGN KEY ("jsPsychExperiment") REFERENCES "JsPsychExperiment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Dataset"
  ADD COLUMN "runtimeType" TEXT,
  ADD COLUMN "runtimeAssetId" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "runtimeAssetVersion" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "assetAuthor" TEXT,
  ADD COLUMN "taskAuthor" TEXT,
  ADD COLUMN "lastSequence" INTEGER DEFAULT 0,
  ADD COLUMN "messageLog" JSONB DEFAULT '[]',
  ADD COLUMN "runtimeData" JSONB DEFAULT '[]';
CREATE INDEX "Dataset_assetAuthor_idx" ON "Dataset"("assetAuthor");
CREATE INDEX "Dataset_taskAuthor_idx" ON "Dataset"("taskAuthor");
ALTER TABLE "Dataset"
  ADD CONSTRAINT "Dataset_assetAuthor_fkey"
  FOREIGN KEY ("assetAuthor") REFERENCES "Profile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dataset"
  ADD CONSTRAINT "Dataset_taskAuthor_fkey"
  FOREIGN KEY ("taskAuthor") REFERENCES "Profile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SummaryResult"
  ADD COLUMN "runtimeType" TEXT,
  ADD COLUMN "runtimeAssetId" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "runtimeAssetVersion" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "assetAuthor" TEXT,
  ADD COLUMN "taskAuthor" TEXT;
CREATE INDEX "SummaryResult_assetAuthor_idx"
  ON "SummaryResult"("assetAuthor");
CREATE INDEX "SummaryResult_taskAuthor_idx"
  ON "SummaryResult"("taskAuthor");
ALTER TABLE "SummaryResult"
  ADD CONSTRAINT "SummaryResult_assetAuthor_fkey"
  FOREIGN KEY ("assetAuthor") REFERENCES "Profile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SummaryResult"
  ADD CONSTRAINT "SummaryResult_taskAuthor_fkey"
  FOREIGN KEY ("taskAuthor") REFERENCES "Profile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
