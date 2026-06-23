// Seed payload for the global Profile (individual) FormDefinition.
// Mirrors the hardcoded blocks in
// frontend/components/Dashboard/Profile/Steps/Blocks/{Basic,Background,Preferences}.js
// using the field types currently supported by DefinitionForm:
// text / textarea / select / checkbox / date / number / rich_text /
// json_array.
//
// Out of scope for v1: introVideo (custom JSON shape), involvement tree
// (custom widget), members panel (orgs only), interest selector (its
// own legacy page).
//
// Consumed by mutations/seedProfileForms.ts.

type Option = { value: string; label: string; order?: number };

type FieldSeed = {
  name: string;
  fieldType: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  isRequired?: boolean;
  storage: "column" | "json_bucket";
  storageColumn?: string;
  storageBucket?: string;
  options?: Option[];
  validation?: Record<string, any>;
  defaultValue?: any;
  jsonArraySchema?: Record<string, any>;
};

type CardSeed = {
  title: string;
  description?: string;
  cardType?: "fields" | "members_panel" | "interest_selector";
  visibleWhenStatus?: string[];
  roleVisibility?: string[];
  fields?: FieldSeed[];
};

type FormSeed = {
  key: string;
  title: string;
  description: string;
  cards: CardSeed[];
};

const PRONOUN_OPTIONS: Option[] = [
  { value: "she", label: "she / her / hers" },
  { value: "he", label: "he / him / his" },
  { value: "they", label: "they / them / theirs" },
];

const MENTOR_PREFER_GRADE: Option[] = [
  { value: "middle", label: "Middle school" },
  { value: "nine", label: "9th – 10th grade" },
  { value: "eleven", label: "11th – 12th grade" },
  { value: "no", label: "No preference" },
];

const MENTOR_PREFER_GROUP: Option[] = [
  { value: "individual", label: "Individual" },
  { value: "group", label: "Group" },
  { value: "no", label: "No preference" },
];

const MENTOR_PREFER_CLASS: Option[] = [
  { value: "accelerated", label: "Accelerated" },
  { value: "nonAccelerated", label: "Non-accelerated" },
  { value: "ell", label: "English-language learners" },
  { value: "no", label: "No preference" },
];

export const PROFILE_INDIVIDUAL_FORM_SEED: FormSeed = {
  key: "profile_individual",
  title: "Profile (individual) — global form",
  description:
    "Default global form used to edit individual-account profiles. " +
    "Per-organization variants can extend or replace this for sponsor staff.",
  cards: [
    {
      title: "About you",
      description: "How others will see you on the platform.",
      fields: [
        {
          name: "firstName",
          fieldType: "text",
          label: "First name",
          isRequired: true,
          storage: "column",
          storageColumn: "firstName",
        },
        {
          name: "lastName",
          fieldType: "text",
          label: "Last name",
          isRequired: true,
          storage: "column",
          storageColumn: "lastName",
        },
        {
          name: "pronouns",
          fieldType: "select",
          label: "Pronouns",
          storage: "column",
          storageColumn: "pronouns",
          options: PRONOUN_OPTIONS,
        },
        {
          name: "location",
          fieldType: "text",
          label: "Where are you based?",
          placeholder: "City, country",
          storage: "column",
          storageColumn: "location",
        },
        {
          name: "organization",
          fieldType: "text",
          label: "Affiliated organization (optional)",
          helperText:
            "Plain-text affiliation. Sponsor accounts manage their organization separately.",
          storage: "column",
          storageColumn: "organization",
        },
        {
          name: "tagline",
          fieldType: "text",
          label: "Tagline",
          helperText:
            "One short line that appears under your name on cards (≤80 chars).",
          storage: "column",
          storageColumn: "tagline",
          validation: { maxLength: 80 },
        },
        {
          name: "publicMail",
          fieldType: "text",
          label: "Public contact email",
          helperText:
            "Shown to other users only when you've opted in to public visibility.",
          placeholder: "you@example.org",
          storage: "column",
          storageColumn: "publicMail",
        },
      ],
    },
    {
      title: "Background",
      description: "Help collaborators understand who you are.",
      fields: [
        {
          name: "occupation",
          fieldType: "text",
          label: "Current role / occupation",
          storage: "column",
          storageColumn: "occupation",
        },
        {
          name: "bio",
          fieldType: "rich_text",
          label: "Bio",
          helperText:
            "Formal version. Markdown is supported via the toolbar above.",
          storage: "column",
          storageColumn: "bio",
        },
        {
          name: "bioInformal",
          fieldType: "rich_text",
          label: "Informal bio",
          helperText: "Used in casual contexts (introductions, chat).",
          storage: "column",
          storageColumn: "bioInformal",
        },
        {
          name: "education",
          fieldType: "json_array",
          label: "Education",
          helperText: "Add one row per institution.",
          storage: "column",
          storageColumn: "education",
          jsonArraySchema: {
            rowSchema: [
              {
                name: "institution",
                fieldType: "text",
                label: "Institution",
                placeholder: "e.g. NYU Tandon",
              },
              {
                name: "degree",
                fieldType: "text",
                label: "Degree",
                placeholder: "e.g. M.S. in Applied Urban Science",
              },
            ],
            addLabel: "Add education",
            minRows: 0,
            maxRows: 10,
          },
        },
        {
          name: "languages",
          fieldType: "json_array",
          label: "Languages",
          helperText: "Languages you speak comfortably enough to mentor in.",
          storage: "column",
          storageColumn: "languages",
          jsonArraySchema: {
            rowSchema: [
              {
                name: "language",
                fieldType: "text",
                label: "Language",
                placeholder: "e.g. Spanish",
              },
            ],
            addLabel: "Add language",
            minRows: 0,
            maxRows: 10,
          },
        },
      ],
    },
    {
      title: "Mentor preferences",
      description:
        "Only relevant if you'll mentor students. Set these so we can match you well.",
      roleVisibility: ["mentor", "scientist", "teacher", "admin"],
      fields: [
        {
          name: "mentorPreferGrade",
          fieldType: "select",
          label: "Preferred grade level",
          storage: "column",
          storageColumn: "mentorPreferGrade",
          options: MENTOR_PREFER_GRADE,
        },
        {
          name: "mentorPreferGroup",
          fieldType: "select",
          label: "Preferred format",
          storage: "column",
          storageColumn: "mentorPreferGroup",
          options: MENTOR_PREFER_GROUP,
        },
        {
          name: "mentorPreferClass",
          fieldType: "select",
          label: "Preferred class type",
          storage: "column",
          storageColumn: "mentorPreferClass",
          options: MENTOR_PREFER_CLASS,
        },
      ],
    },
  ],
};
