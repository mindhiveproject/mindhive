-- Data Journal dataset visibility: an explicit public flag (admins) and
-- teacher-controlled sharing with classes. See keystone/lib/datasourceAccess.js.
ALTER TABLE "Datasource" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "_Class_sharedDatasources" ("A" TEXT NOT NULL, "B" TEXT NOT NULL);
CREATE UNIQUE INDEX "_Class_sharedDatasources_AB_unique" ON "_Class_sharedDatasources"("A", "B");
CREATE INDEX "_Class_sharedDatasources_B_index" ON "_Class_sharedDatasources"("B");
ALTER TABLE "_Class_sharedDatasources" ADD CONSTRAINT "_Class_sharedDatasources_A_fkey" FOREIGN KEY ("A") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_Class_sharedDatasources" ADD CONSTRAINT "_Class_sharedDatasources_B_fkey" FOREIGN KEY ("B") REFERENCES "Datasource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Before this, a dataset counted as public when a public template journal used
-- it. Same as the backfillPublicDatasources mutation.
UPDATE "Datasource" SET "isPublic" = true
WHERE "id" IN (
  SELECT dj."A" FROM "_Datasource_journal" dj
  JOIN "VizPart" vp ON vp."id" = dj."B"
  WHERE vp."isPublic" = true AND vp."isTemplate" = true
);
