// Pre-publish validation for FormDefinitions. Returns a list of human-
// readable error strings; an empty array means "good to publish".
//
// We can't trust the admin UI to perfectly guard against typos —
// publishing a form that points at a non-existent column would brick
// the entire form for every sponsor at that scope. This check is the
// parachute: it runs server-side inside publishFormDefinition before
// the status flip, and aborts the publish if any field is wired wrong.
//
// Manually maintained against the schemas in keystone/schemas/. When
// you add/rename/remove a column on Profile/Opportunity/Organization,
// update the whitelist below to match.

// Map from a definition.key → which entity its target=self fields land on.
// Keys not in this map are assumed to be admin-defined custom surfaces
// without a runtime renderer; they're allowed any storage value (the
// renderer would just fail when it tries to render them, which is the
// admin's problem at that point).
const ENTITY_FOR_KEY: Record<string, string> = {
  opportunity: "Opportunity",
  profile_individual: "Profile",
  profile_organization: "Profile",
};

// Whitelist of column names per entity. Must be writable via the
// auto-generated Keystone update inputs (so no virtual fields, no
// relationship inverses).
const ALLOWED_COLUMNS: Record<string, string[]> = {
  Opportunity: [
    "title",
    "shortDescription",
    "description",
    "projectCategory",
    "projectCategoryOther",
    "coverImage",
    "coverImageUrl",
    "videoUrl",
    "videoFile",
    "availableFrom",
    "availableTo",
    "timeCommitment",
    "studentCapacity",
    "teamSize",
    "allowsTeamPreferences",
    "preferGradeLevels",
    "preferClassType",
    "preferGroupFormat",
    "status",
    "sponsorIsMentor",
    "mentorNotes",
    "scopeDescription",
    "potentialActivities",
    "specificSkills",
    "guidelinesAcknowledged",
    "requestsAppointment",
    "issueRelevance",
    "specialConsiderations",
    "dataSecurityConcerns",
    "dataSecurityNotes",
    "techRequirements",
    "competencies",
    "learningOutcomes",
    "designedForSpecificStudents",
    "requiresBusinessHours",
    "privateClientDataNotes",
    "fieldWorkLikelihood",
    "researchQuestion",
    "dataRequirements",
    "backgroundMethodology",
    "classNetworks",
  ],
  Profile: [
    "firstName",
    "lastName",
    "pronouns",
    "location",
    "organization",
    "tagline",
    "publicMail",
    "passion",
    "bio",
    "bioInformal",
    "occupation",
    "department",
    "primaryDomain",
    "timeCommitment",
    "education",
    "languages",
    "mentorPreferGrade",
    "mentorPreferGroup",
    "mentorPreferClass",
    "website",
    "facebook",
    "twitter",
    "instagram",
    "introVideo",
    "involvement",
    "availableStartDate",
    "availableEndDate",
    "availableStartTime",
    "availableEndTime",
    "availableDays",
    "interests",
    "language",
    "isPublic",
  ],
  Organization: [
    "name",
    "tagline",
    "department",
    "website",
    "location",
    "mission",
    "primaryDomain",
    "logo",
    "verified",
    "interests",
  ],
};

// Json-bucket column names per entity.
const ALLOWED_BUCKETS: Record<string, string[]> = {
  Opportunity: ["proposalData", "extraDetails", "relevantLinks"],
  Profile: [
    "info",
    "generalInfo",
    "studiesInfo",
    "consentsInfo",
    "tasksInfo",
  ],
  Organization: ["extraDetails"],
};

const ALLOWED_FIELD_TYPES = new Set([
  "text",
  "textarea",
  "rich_text",
  "number",
  "date",
  "select",
  "multiselect",
  "checkbox",
  "image",
  "file",
  "video_url",
  "tag_multiselect",
  "json_array",
  "read_only_html",
]);

const ALLOWED_CARD_TYPES = new Set([
  "fields",
  "members_panel",
  "interest_selector",
]);

type FormFieldRow = {
  id: string;
  name?: string | null;
  fieldType?: string | null;
  storage?: string | null;
  storageColumn?: string | null;
  storageBucket?: string | null;
  storageEntity?: string | null;
  options?: any;
};

type FormCardRow = {
  id: string;
  title?: string | null;
  cardType?: string | null;
  fields?: FormFieldRow[];
};

type FormDefinitionRow = {
  id: string;
  key: string;
  cards?: FormCardRow[];
};

// Resolve which entity a (definition, storageEntity) pair targets.
function entityFor(definition: FormDefinitionRow, storageEntity?: string | null) {
  if (storageEntity === "organization") return "Organization";
  return ENTITY_FOR_KEY[definition.key] || null;
}

export function validateFormDefinition(
  definition: FormDefinitionRow
): string[] {
  const errors: string[] = [];
  const seenFieldNames = new Set<string>();

  if (!definition.cards || definition.cards.length === 0) {
    errors.push("Definition has no cards. Add at least one card before publishing.");
    return errors;
  }

  for (const card of definition.cards) {
    const cardLabel = card.title || `(untitled card ${card.id})`;

    if (!ALLOWED_CARD_TYPES.has(card.cardType || "fields")) {
      errors.push(
        `Card "${cardLabel}" has unknown cardType "${card.cardType}".`
      );
    }

    if (card.cardType !== "fields") {
      // members_panel / interest_selector — fields ignored at runtime.
      continue;
    }

    const fields = card.fields || [];
    for (const f of fields) {
      const fieldLabel = f.name || `(unnamed field ${f.id})`;

      if (!f.name || !f.name.trim()) {
        errors.push(`Field on card "${cardLabel}" has no name.`);
        continue;
      }
      // Field-name uniqueness within the definition (open question #12).
      if (seenFieldNames.has(f.name)) {
        errors.push(
          `Duplicate field name "${f.name}" — names must be unique within a definition.`
        );
      }
      seenFieldNames.add(f.name);

      if (!f.fieldType || !ALLOWED_FIELD_TYPES.has(f.fieldType)) {
        errors.push(
          `Field "${fieldLabel}" on card "${cardLabel}" has unknown fieldType "${f.fieldType}".`
        );
        continue;
      }

      // read_only_html doesn't write anywhere; storage settings are
      // irrelevant for it.
      if (f.fieldType === "read_only_html") continue;

      const targetEntity = entityFor(definition, f.storageEntity);
      // Unknown key + entity-mapping → can't validate storage. Warn but
      // don't block — the admin may be working on a brand-new surface
      // that doesn't have a runtime renderer yet.
      if (!targetEntity) continue;

      if (f.storage === "column") {
        const col = (f.storageColumn || "").trim();
        if (!col) {
          errors.push(
            `Field "${fieldLabel}" has storage=column but no storageColumn set.`
          );
          continue;
        }
        const allowed = ALLOWED_COLUMNS[targetEntity] || [];
        if (!allowed.includes(col)) {
          errors.push(
            `Field "${fieldLabel}" points at column "${col}" on ${targetEntity}, which doesn't exist (or isn't writable). Allowed columns: ${allowed.join(", ")}.`
          );
        }
      } else if (f.storage === "json_bucket") {
        const bucket = (f.storageBucket || "").trim();
        if (!bucket) {
          errors.push(
            `Field "${fieldLabel}" has storage=json_bucket but no storageBucket set.`
          );
          continue;
        }
        const allowed = ALLOWED_BUCKETS[targetEntity] || [];
        if (!allowed.includes(bucket)) {
          errors.push(
            `Field "${fieldLabel}" writes to json bucket "${bucket}" on ${targetEntity}, which doesn't exist. Allowed buckets: ${allowed.join(", ")}.`
          );
        }
      } else {
        errors.push(
          `Field "${fieldLabel}" has unknown storage "${f.storage}". Expected "column" or "json_bucket".`
        );
      }

      // Select / multiselect / tag_multiselect must have at least one
      // option (tag_multiselect pulls options from the Tag table at
      // runtime, so it's allowed to have no admin-defined options).
      if (
        (f.fieldType === "select" || f.fieldType === "multiselect") &&
        (!Array.isArray(f.options) || f.options.length === 0)
      ) {
        errors.push(
          `Field "${fieldLabel}" is type ${f.fieldType} but has no options defined.`
        );
      }
    }
  }

  return errors;
}
