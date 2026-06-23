// Seed payload for the global Profile (organization) FormDefinition.
//
// The form's "target entity" is still the Profile (a sponsor's personal
// account). Fields with storageEntity="organization" route through to
// the Profile's first linked Organization — that's where mission /
// department / interests / logo live. Personal-contact fields stay on
// the Profile itself (storageEntity="self", the default).
//
// Three card types appear here:
//   - "fields": standard list of FormField rows
//   - "members_panel": special card that mounts the existing
//     Members.js relationship-management UI
//   - "interest_selector": deferred — interests are seeded as an inline
//     tag_multiselect field for now (simpler than the legacy page wrapper)

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
  storageEntity?: "self" | "organization";
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

const PRIMARY_DOMAIN: Option[] = [
  { value: "academic", label: "Academic institution" },
  { value: "government", label: "Government agency" },
  { value: "industry", label: "Industry (private / start-up)" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "other", label: "Other" },
];

export const PROFILE_ORGANIZATION_FORM_SEED: FormSeed = {
  key: "profile_organization",
  title: "Profile (organization) — global form",
  description:
    "Default global form for sponsor accounts. Personal-contact fields " +
    "write to the Profile row; organization fields (name, mission, " +
    "primary domain, logo, interests) write to the linked Organization.",
  cards: [
    {
      title: "Organization",
      description:
        "Public-facing details about your organization. Visible to students browsing opportunities.",
      fields: [
        {
          name: "name",
          fieldType: "text",
          label: "Organization name",
          isRequired: true,
          storage: "column",
          storageColumn: "name",
          storageEntity: "organization",
        },
        {
          name: "tagline",
          fieldType: "text",
          label: "Tagline",
          placeholder: "One short line — appears under the name on cards",
          storage: "column",
          storageColumn: "tagline",
          storageEntity: "organization",
          validation: { maxLength: 100 },
        },
        {
          name: "department",
          fieldType: "text",
          label: "Department / division",
          storage: "column",
          storageColumn: "department",
          storageEntity: "organization",
        },
        {
          name: "primaryDomain",
          fieldType: "select",
          label: "Primary domain",
          storage: "column",
          storageColumn: "primaryDomain",
          storageEntity: "organization",
          options: PRIMARY_DOMAIN,
        },
        {
          name: "website",
          fieldType: "text",
          label: "Website",
          placeholder: "https://…",
          storage: "column",
          storageColumn: "website",
          storageEntity: "organization",
        },
        {
          name: "location",
          fieldType: "text",
          label: "Where are you based?",
          placeholder: "City, country",
          storage: "column",
          storageColumn: "location",
          storageEntity: "organization",
        },
        {
          name: "mission",
          fieldType: "rich_text",
          label: "Mission",
          helperText: "What does your organization do? Why does it exist?",
          storage: "column",
          storageColumn: "mission",
          storageEntity: "organization",
        },
        {
          name: "logo",
          fieldType: "image",
          label: "Logo",
          helperText: "Square works best. Max ~10MB.",
          storage: "column",
          storageColumn: "logo",
          storageEntity: "organization",
          validation: { maxFileSize: 10 * 1024 * 1024 },
        },
      ],
    },
    {
      title: "Interests",
      description:
        "Where can your organization help students? Pick all that apply.",
      fields: [
        {
          name: "interests",
          fieldType: "tag_multiselect",
          label: "Topics of interest",
          storage: "column",
          storageColumn: "interests",
          storageEntity: "organization",
        },
      ],
    },
    {
      title: "Point of contact",
      description:
        "Your personal details. Students won't see your private email — only the public contact below.",
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
          name: "occupation",
          fieldType: "text",
          label: "Your role at the organization",
          storage: "column",
          storageColumn: "occupation",
        },
        {
          name: "publicMail",
          fieldType: "text",
          label: "Public contact email",
          helperText:
            "Shown to students who reach out about opportunities you host.",
          placeholder: "you@example.org",
          storage: "column",
          storageColumn: "publicMail",
        },
        {
          name: "passion",
          fieldType: "textarea",
          label: "What draws you to this work?",
          helperText: "Optional — but it helps mentees connect with you.",
          storage: "column",
          storageColumn: "passion",
        },
        {
          name: "timeCommitment",
          fieldType: "text",
          label: "Time you can commit per week",
          placeholder: "e.g. 2 hours / week",
          storage: "column",
          storageColumn: "timeCommitment",
        },
      ],
    },
    {
      title: "Team members",
      description:
        "Invite colleagues at your organization to manage opportunities together.",
      cardType: "members_panel",
    },
  ],
};
