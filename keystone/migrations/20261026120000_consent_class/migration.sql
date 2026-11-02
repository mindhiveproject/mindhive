-- Link a consent protocol to the class whose teaching team reviews it.
ALTER TABLE "Consent" ADD COLUMN "class" TEXT;

CREATE INDEX "Consent_class_idx" ON "Consent"("class");

ALTER TABLE "Consent" ADD CONSTRAINT "Consent_class_fkey" FOREIGN KEY ("class") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
