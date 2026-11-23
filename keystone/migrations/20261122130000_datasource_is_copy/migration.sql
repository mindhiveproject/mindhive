-- Data Journal: mark datasets made as copies (copy prompt, template journals)
-- so they are listed with the user's own datasets rather than as uploads.
ALTER TABLE "Datasource" ADD COLUMN "isCopy" BOOLEAN NOT NULL DEFAULT false;
