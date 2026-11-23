-- Data Journal: whether a dataset's study and board team may read it. Existing
-- datasets keep today's visibility (true); fresh copies are created private.
-- See keystone/lib/datasourceAccess.js.
ALTER TABLE "Datasource" ADD COLUMN "sharedWithTeam" BOOLEAN NOT NULL DEFAULT true;
