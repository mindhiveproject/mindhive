// Consent form types offered on the platform. `name` is the key the study
// join flow (Studies/Join/Consents/Form.js) looks up in `consent.info`.
// `audience` picks the wording of audience-specific sections.
export const CONSENT_TYPES = [
  {
    name: "regularAdults",
    hint: "Shown to participants 18+",
    label: "Adult consent",
    description: "The consent form for regular adult participants",
    audience: "adult",
  },
  {
    name: "regularMinors",
    hint: "Emailed to parents of under-18 participants",
    label: "Parent / guardian permission",
    description:
      "The consent form for parents of regular participants under 18",
    audience: "parent",
  },
  {
    name: "regularMinorsKids",
    hint: "Shown to under-18 participants after parent approves",
    label: "Participant assent",
    description: "The consent form for regular participants under 18",
    audience: "minor",
  },
  {
    name: "sonaAdults",
    hint: "Shown to SONA participants 18+",
    label: "SONA adult consent",
    description: "The consent form for SONA adult participants",
    audience: "adult",
  },
  {
    name: "sonaMinors",
    hint: "Emailed to parents of under-18 SONA participants",
    label: "SONA parent / guardian permission",
    description: "The consent form for parents of SONA participants under 18",
    audience: "parent",
  },
  {
    name: "sonaMinorsKids",
    hint: "Shown to under-18 SONA participants after parent approves",
    label: "SONA participant assent",
    description: "The consent form for SONA participants under 18",
    audience: "minor",
  },
  {
    name: "studentsNYC",
    hint: "Shown to NYC public school students 18+",
    label: "NYC student consent",
    description:
      "The consent form for adult students in a public school in NYC",
    audience: "adult",
  },
  {
    name: "studentsParentsNYC",
    hint: "Emailed to parents of under-18 NYC public school students",
    label: "NYC parent / guardian permission",
    description:
      "The consent form for parents of students in a public school in NYC under 18",
    audience: "parent",
  },
  {
    name: "studentsMinorsNYC",
    hint: "Shown to under-18 NYC public school students after parent approves",
    label: "NYC student assent",
    description:
      "The consent form for students in a public school in NYC under 18",
    audience: "minor",
  },
];

// The only form types a student works on
export const STUDENT_CONSENT_TYPES = [
  "regularAdults",
  "regularMinors",
  "regularMinorsKids",
];

// Sections are admin-defined FormDefinitions, one per audience (keys
// consent_<audience>, seeded in keystone/mutations/seedData/consentFormSeed.ts).
// Each text field is a section stored under its name in info[i].sections;
// required fields must be filled for a form to be ready.
// Keep in sync with keystone/mutations/consentReview.ts.
export const CONSENT_AUDIENCES = ["adult", "parent", "minor"];
const SECTION_FIELD_TYPES = ["text", "textarea"];

export function consentDefinitionKey(audience) {
  return `consent_${audience}`;
}

// Form types with no known audience (older custom ones) use the adult wording
export function audienceOf(name) {
  return getConsentType(name)?.audience || "adult";
}

// Built-in sections: used while definitions load, when none is published,
// and for protocols submitted before section snapshots existed.
// `label` may depend on the audience.
export const CONSENT_SECTIONS = [
  {
    key: "purpose",
    label: () => "Purpose of the study",
    checklist: "Purpose",
  },
  {
    key: "activities",
    label: (audience) =>
      audience === "parent"
        ? "What your child will do · Time required"
        : "What you will do · Time required",
    checklist: "Activities & time",
  },
  { key: "risks", label: () => "Possible risks", checklist: "Risks" },
  { key: "benefits", label: () => "Benefits", checklist: "Benefits" },
  {
    key: "privacy",
    label: () => "Privacy & data",
    checklist: "Privacy & data",
  },
  {
    key: "voluntary",
    label: () => "Voluntary participation · Right to stop",
    checklist: "Voluntary / right to stop",
  },
  { key: "contacts", label: () => "Contacts", checklist: "Contacts" },
];

// Free-form rich text kept from protocols written before sections existed
export const LEGACY_SECTION = "additional";

export function getConsentType(name) {
  return CONSENT_TYPES.find((type) => type.name === name);
}

// Students get the reduced view, unless they also hold a role that manages
// research (a teacher with a student account sees everything)
export function isStudentUser(user) {
  const names = (user?.permissions || []).map((p) => p?.name);
  return (
    names.includes("STUDENT") &&
    !names.some((name) =>
      ["ADMIN", "TEACHER", "MENTOR", "SCIENTIST"].includes(name)
    )
  );
}

// Form types shown as tabs: the three student ones for students, otherwise
// every platform type plus any other type already stored on the protocol.
export function visibleConsentTypes(user, info = []) {
  if (isStudentUser(user)) return STUDENT_CONSENT_TYPES;
  const names = CONSENT_TYPES.map((type) => type.name);
  (info || []).forEach((block) => {
    if (block?.name && !names.includes(block.name)) names.push(block.name);
  });
  return names;
}

// Make sure every platform type has a block with a `sections` object.
// Blocks written before sections existed keep their text as LEGACY_SECTION.
export function normalizeInfo(info) {
  const blocks = (info || []).map((block) => ({
    ...block,
    sections:
      block?.sections || (block?.text ? { [LEGACY_SECTION]: block.text } : {}),
  }));
  CONSENT_TYPES.forEach((type) => {
    if (!blocks.some((block) => block?.name === type.name)) {
      blocks.push({
        name: type.name,
        description: type.description,
        sections: {},
      });
    }
  });
  return blocks;
}

export function sectionFilled(block, key) {
  return !!stripHtml(block?.sections?.[key]).trim();
}

// Built-in sections in the shape of definition sections
export function fallbackSections(audience) {
  return CONSENT_SECTIONS.map((section) => ({
    key: section.key,
    label: section.label(audience),
    checklist: section.checklist,
    required: true,
    builtIn: true,
  }));
}

// Sections of a resolved consent FormDefinition, in card and field order
export function definitionSections(definition) {
  return (definition?.cards || [])
    .flatMap((card) => card?.fields || [])
    .filter((field) => SECTION_FIELD_TYPES.includes(field?.fieldType))
    .map((field) => ({
      key: field.name,
      label: field.label,
      labelI18n: field.labelI18n,
      helperText: field.helperText,
      helperTextI18n: field.helperTextI18n,
      placeholder: field.placeholder,
      required: !!field.isRequired,
    }));
}

export function requiredSections(sections) {
  return (sections || []).filter((section) => section.required);
}

// Number of required sections filled in
export function completedSections(block, sections) {
  return requiredSections(sections).filter((section) =>
    sectionFilled(block, section.key)
  ).length;
}

export function formReady(block, sections) {
  return (
    completedSections(block, sections) === requiredSections(sections).length
  );
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Build the HTML participants see at study join from a block's sections.
// TODO: display the sections individually to participants instead.
export function assembleText(block, sections) {
  const parts = (sections || []).filter((section) =>
    sectionFilled(block, section.key)
  ).map((section) => {
    const paragraphs = String(block.sections[section.key])
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("");
    return `<h4>${escapeHtml(section.label)}</h4>${paragraphs}`;
  });
  if (sectionFilled(block, LEGACY_SECTION)) {
    parts.push(block.sections[LEGACY_SECTION]);
  }
  return parts.join("");
}

// Info ready to save: every block carries the assembled participant text.
// `sectionsFor(name)` gives the sections of a form type.
export function finalizeInfo(info, sectionsFor) {
  return (info || []).map((block) => ({
    ...block,
    text: assembleText(block, sectionsFor(block?.name)),
  }));
}

// Who can take part. Ticking a group adds its consent forms to the protocol;
// under-18 groups also need parent / guardian permission.
export const PARTICIPANT_GROUPS = [
  {
    key: "adults",
    label: "Adults (18+)",
    hint: "Participants aged 18 or older",
    forms: ["regularAdults"],
    minors: false,
    student: true,
  },
  {
    key: "minors",
    label: "Under 18",
    hint: "Participants under 18, with parent / guardian permission",
    forms: ["regularMinors", "regularMinorsKids"],
    minors: true,
    student: true,
  },
  {
    key: "sonaAdults",
    label: "SONA adults (18+)",
    hint: "SONA participants aged 18 or older",
    forms: ["sonaAdults"],
    minors: false,
  },
  {
    key: "sonaMinors",
    label: "SONA participants under 18",
    hint: "SONA participants under 18, with parent / guardian permission",
    forms: ["sonaMinors", "sonaMinorsKids"],
    minors: true,
  },
  {
    key: "nycAdults",
    hidden: true,
    label: "NYC public school students (18+)",
    hint: "Students aged 18 or older in a public school in NYC",
    forms: ["studentsNYC"],
    minors: false,
  },
  {
    key: "nycMinors",
    hidden: true,
    label: "NYC public school students under 18",
    hint: "Students under 18 in a public school in NYC, with parent / guardian permission",
    forms: ["studentsParentsNYC", "studentsMinorsNYC"],
    minors: true,
  },
];

// Groups ticked on a protocol that is being created
export const DEFAULT_GROUPS = ["adults", "minors"];

export function visibleGroups(user) {
  return PARTICIPANT_GROUPS.filter(
    (group) => !group.hidden && (group.student || !isStudentUser(user))
  );
}

export function hasMinorGroup(groups = []) {
  return PARTICIPANT_GROUPS.some(
    (group) => group.minors && groups.includes(group.key)
  );
}

// Form types of the ticked groups, in tab order. Types that belong to no
// group (older custom ones) stay visible to non-students.
export function consentTypesForGroups(user, groups = [], info = []) {
  const grouped = PARTICIPANT_GROUPS.flatMap((group) => group.forms);
  const selected = PARTICIPANT_GROUPS.filter(
    (group) => !group.hidden && groups.includes(group.key)
  ).flatMap((group) => group.forms);
  return visibleConsentTypes(user, info).filter(
    (name) => selected.includes(name) || !grouped.includes(name)
  );
}

// Parent permission emails (consent.settings.parentPermission)
export const LINK_EXPIRY_DAYS = [3, 7, 14, 30];
export const REMINDER_AFTER_DAYS = [1, 2, 3, 5];

// Always on when an under-18 group is ticked
const DEFAULT_PARENT_PERMISSION = {
  linkExpiryDays: 7,
  reminderAfterDays: 3,
};

// Protocols saved before groups existed show every group, so no form is
// hidden from them.
export function normalizeSettings(settings, defaultGroups) {
  const groups =
    settings?.eligibility?.groups ||
    defaultGroups ||
    PARTICIPANT_GROUPS.map((group) => group.key);
  const { linkExpiryDays, reminderAfterDays } = {
    ...DEFAULT_PARENT_PERMISSION,
    ...(settings?.parentPermission || {}),
  };
  return {
    ...(settings || {}),
    eligibility: { groups },
    parentPermission: { linkExpiryDays, reminderAfterDays },
  };
}
