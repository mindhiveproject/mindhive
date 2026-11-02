// Seed payloads for the global consent FormDefinitions, one per audience
// (consent_adult / consent_parent / consent_minor). Each field is a
// section of the consent form; required fields are the sections a form
// needs before it counts as ready. Mirrors the CONSENT_SECTIONS fallback
// in frontend/components/Dashboard/Consent/consentTypes.js.
//
// Field names are the keys stored in Consent.info[i].sections, so they
// must not change once protocols use them.
//
// Consumed by mutations/seedMissingForms.ts.

type Audience = "adult" | "parent" | "minor";

const AUDIENCE_TITLES: Record<Audience, string> = {
  adult: "Adult consent",
  parent: "Parent / guardian permission",
  minor: "Participant assent",
};

function sectionFields(audience: Audience) {
  return [
    { name: "purpose", label: "Purpose of the study" },
    {
      name: "activities",
      label:
        audience === "parent"
          ? "What your child will do · Time required"
          : "What you will do · Time required",
    },
    { name: "risks", label: "Possible risks" },
    { name: "benefits", label: "Benefits" },
    { name: "privacy", label: "Privacy & data" },
    { name: "voluntary", label: "Voluntary participation · Right to stop" },
    { name: "contacts", label: "Contacts" },
  ].map((field) => ({
    ...field,
    fieldType: "textarea",
    isRequired: true,
    storage: "json_bucket" as const,
    storageBucket: "sections",
  }));
}

function consentSeed(audience: Audience) {
  return {
    key: `consent_${audience}`,
    title: `Consent sections — ${AUDIENCE_TITLES[audience]}`,
    description:
      "Sections students and researchers fill in for this consent form " +
      "audience (/dashboard/irb). Required fields must be filled before " +
      "a form is ready. Field names are the stored section keys: rename " +
      "labels freely, but keep names stable.",
    cards: [{ title: "Sections", fields: sectionFields(audience) }],
  };
}

export const CONSENT_FORM_SEEDS = (["adult", "parent", "minor"] as const).map(
  consentSeed
);
