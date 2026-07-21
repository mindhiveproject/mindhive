// Seed payload for the global Opportunity FormDefinition. Mirrors the
// hardcoded form in frontend/components/Dashboard/Connect/Opportunities/Editor.js,
// covering the cards / fields that use the simple field types implemented
// in Phase 3. Complex types (rich text, image, file, video URL) land in
// Phase 4.5 and update this seed accordingly.
//
// The shape here is consumed by mutations/seedOpportunityForm.ts which
// walks it and inserts FormDefinition + FormCard + FormField rows.

type Option = {
  value: string;
  label: string;
  order?: number;
};

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

const DATASET_PROVISION_OPTIONS: Option[] = [
  { value: "public", label: "Public / open data" },
  {
    value: "org_no_restrictions",
    label: "Our organization will provide data — no special restrictions",
  },
  {
    value: "org_privacy_nda",
    label: "Our organization will provide data — privacy / NDA required",
  },
  { value: "other", label: "Other (please describe)" },
];

const DELIVERABLE_OPTIONS: Option[] = [
  { value: "academic_paper", label: "Academic paper" },
  { value: "algorithm_development", label: "Algorithm development" },
  { value: "data_visualizations", label: "Data visualizations" },
  { value: "github_repository", label: "GitHub repository" },
  { value: "interactive_dashboard", label: "Interactive dashboard" },
  { value: "literature_review", label: "Literature review" },
  { value: "machine_learning_model", label: "Machine learning model" },
  { value: "policy_memo", label: "Policy memo" },
  { value: "policy_recommendations", label: "Policy recommendations" },
  { value: "project_website", label: "Project website" },
  { value: "survey_evaluation_tools", label: "Survey / evaluation tools" },
  { value: "technical_report", label: "Technical report" },
  { value: "web_application", label: "Web application" },
  { value: "other", label: "Other" },
];

const SOFTWARE_OPTIONS: Option[] = [
  { value: "team_discretion", label: "Team discretion" },
  { value: "python", label: "Python" },
  { value: "r", label: "R" },
  { value: "r_shiny", label: "R Shiny" },
  { value: "sql", label: "SQL" },
  { value: "postgresql_postgis", label: "PostgreSQL / PostGIS" },
  { value: "qgis", label: "QGIS" },
  { value: "arcgis", label: "ArcGIS" },
  { value: "tableau", label: "Tableau" },
  { value: "power_bi", label: "Power BI" },
  { value: "jupyter", label: "Jupyter" },
  { value: "github", label: "GitHub" },
  { value: "docker", label: "Docker" },
  { value: "apache_spark", label: "Apache Spark" },
  { value: "databricks", label: "Databricks" },
  { value: "google_earth_engine", label: "Google Earth Engine" },
  { value: "geopandas", label: "GeoPandas" },
  { value: "javascript", label: "JavaScript" },
  { value: "snowflake", label: "Snowflake" },
  { value: "tensorflow", label: "TensorFlow" },
  { value: "pytorch", label: "PyTorch" },
  { value: "llm_genai", label: "LLM / GenAI" },
  { value: "computer_vision", label: "Computer vision" },
  { value: "nlp", label: "NLP" },
  { value: "other", label: "Other" },
];

const HARDWARE_OPTIONS: Option[] = [
  { value: "team_discretion", label: "Team discretion" },
  { value: "microcontrollers", label: "Microcontrollers" },
  { value: "sensors", label: "Sensors" },
  { value: "cameras_cv", label: "Cameras / CV" },
  { value: "gpu_access", label: "GPU access" },
  { value: "other", label: "Other" },
];

const YES_NO_OPTIONS: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const FIELD_RESEARCH_OPTIONS: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "beneficial", label: "Beneficial but not required" },
];

const INTERNSHIP_INTEREST_OPTIONS: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" },
];

const PROJECT_CATEGORY_OPTIONS: Option[] = [
  { value: "urban_health", label: "Urban health" },
  { value: "urban_environment", label: "Urban environment" },
  { value: "urban_infrastructure", label: "Urban infrastructure" },
  { value: "other", label: "Other" },
];

const PREFER_GROUP_FORMAT_OPTIONS: Option[] = [
  { value: "individual", label: "Individual only" },
  { value: "team", label: "Team only" },
  { value: "either", label: "Either" },
];

const PREFER_GRADE_LEVELS_OPTIONS: Option[] = [
  { value: "middle", label: "Middle school" },
  { value: "nine", label: "9th – 10th grade" },
  { value: "eleven", label: "11th – 12th grade" },
];

const PREFER_CLASS_TYPE_OPTIONS: Option[] = [
  { value: "accelerated", label: "Accelerated" },
  { value: "nonAccelerated", label: "Non-accelerated" },
  { value: "ell", label: "English-language learners" },
];

const STATUS_OPTIONS_SPONSOR: Option[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Submitted for review" },
];

// HTML for the "Understanding of Proposal Guidelines" read-only field on
// the Publishing card. Renders the agreement statement + clickable link
// chips to the FAQ and Mutual Expectations documents. Mirrors the
// legacy GUIDELINE_DOCUMENTS array in
// frontend/components/Dashboard/Connect/Opportunities/Editor.js. Admins
// can edit this HTML in the form-definition editor to update URLs.
const CHIP_STYLE =
  "display:inline-flex;align-items:center;gap:6px;padding:8px 14px;" +
  "border:1px solid #d3dae0;border-radius:100px;background:#ffffff;" +
  "color:#336f8a;text-decoration:none;font-weight:600;font-size:13px;" +
  "font-family:Nunito,sans-serif;";

const GUIDELINES_HTML = [
  '<p style="margin:0 0 12px;color:#171717;font-size:14px;line-height:1.5;">',
  "I have read and understood the Capstone proposal guidelines in full, ",
  "including all of the Capstone Sponsor FAQs and Mutual Expectations ",
  "agreement and agree to abide by them.",
  "</p>",
  '<div style="display:flex;gap:8px;flex-wrap:wrap;">',
  '<a href="https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects" ',
  `target="_blank" rel="noopener noreferrer" style="${CHIP_STYLE}">`,
  "📄 Capstone Sponsor FAQs",
  "</a>",
  '<a href="https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects/cusp-capstone-mutual-expectations" ',
  `target="_blank" rel="noopener noreferrer" style="${CHIP_STYLE}">`,
  "📄 Mutual Expectations agreement",
  "</a>",
  "</div>",
].join("");

const STATUS_OPTIONS_ADMIN: Option[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Submitted for review" },
  { value: "returned", label: "Returned" },
  { value: "pre_selected", label: "Pre-selected" },
  { value: "accepted", label: "Accepted" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export const OPPORTUNITY_FORM_SEED: FormSeed = {
  key: "opportunity",
  title: "Opportunity (Capstone) — global form",
  description:
    "Default global form used to create and edit Connect Opportunities. " +
    "Admins can clone this for per-organization variants.",
  cards: [
    {
      title: "Basic info",
      description: "Project title and a one-line summary.",
      fields: [
        {
          name: "title",
          fieldType: "text",
          label: "Project title",
          helperText: "Concise, descriptive title (≤15 words).",
          isRequired: true,
          storage: "column",
          storageColumn: "title",
          validation: { wordLimit: 15, maxLength: 200 },
        },
        {
          name: "shortDescription",
          fieldType: "text",
          label: "Short description",
          helperText: "One sentence that will appear in browse lists.",
          storage: "column",
          storageColumn: "shortDescription",
          validation: { maxLength: 240 },
        },
        {
          name: "description",
          fieldType: "textarea",
          label: "Project description",
          helperText:
            "Plain-text description. Rich-text editing returns in a later phase.",
          storage: "column",
          storageColumn: "description",
          validation: { wordLimit: 250 },
        },
      ],
    },
    {
      title: "Project category",
      fields: [
        {
          name: "projectCategory",
          fieldType: "select",
          label: "Primary category",
          storage: "column",
          storageColumn: "projectCategory",
          options: PROJECT_CATEGORY_OPTIONS,
        },
        {
          name: "projectCategoryOther",
          fieldType: "text",
          label: "If \"Other\", please specify",
          storage: "column",
          storageColumn: "projectCategoryOther",
        },
      ],
    },
    {
      title: "Media",
      description:
        "Upload a cover image and/or paste a YouTube / Vimeo / Loom / Google Drive link for an intro video.",
      fields: [
        {
          name: "coverImage",
          fieldType: "image",
          label: "Cover image",
          helperText:
            "Upload a JPG / PNG (max ~10MB). Shown in browse lists and at the top of the detail page.",
          storage: "column",
          storageColumn: "coverImage",
          validation: { maxFileSize: 10 * 1024 * 1024 },
        },
        {
          name: "coverImageUrl",
          fieldType: "text",
          label: "Or paste an image URL",
          helperText:
            "Used only when no upload is provided. The upload takes priority.",
          placeholder: "https://…",
          storage: "column",
          storageColumn: "coverImageUrl",
        },
        {
          name: "videoFile",
          fieldType: "file",
          label: "Intro video file",
          helperText:
            "Upload an MP4 / WebM (max ~500MB). Used when no embed URL is set.",
          storage: "column",
          storageColumn: "videoFile",
          validation: {
            maxFileSize: 500 * 1024 * 1024,
            allowedMimes: "video/mp4,video/webm",
          },
        },
        {
          name: "videoUrl",
          fieldType: "video_url",
          label: "Or paste a video URL / embed",
          helperText:
            "YouTube, Vimeo, Loom, or Google Drive. A live preview will appear below.",
          placeholder: "https://youtube.com/watch?v=…",
          storage: "column",
          storageColumn: "videoUrl",
        },
      ],
    },
    {
      title: "Capstone proposal overview",
      description:
        "Detailed proposal narrative — datasets, deliverables, tooling, and any obstacles you foresee.",
      fields: [
        {
          name: "relevance",
          fieldType: "textarea",
          label: "Why does this project matter?",
          helperText: "Up to 250 words.",
          storage: "json_bucket",
          storageBucket: "proposalData",
          validation: { wordLimit: 250 },
        },
        {
          name: "requiresSpecialResources",
          fieldType: "select",
          label: "Does this project require special resources?",
          storage: "json_bucket",
          storageBucket: "proposalData",
          options: YES_NO_OPTIONS,
        },
        {
          name: "specialResourcesNotes",
          fieldType: "text",
          label: "If yes, briefly describe what you'd need",
          storage: "json_bucket",
          storageBucket: "proposalData",
        },
        {
          name: "datasetProvision",
          fieldType: "multiselect",
          label: "How will datasets be provided?",
          storage: "json_bucket",
          storageBucket: "proposalData",
          options: DATASET_PROVISION_OPTIONS,
        },
        {
          name: "datasetProvisionOther",
          fieldType: "text",
          label: "If \"Other\", please specify",
          storage: "json_bucket",
          storageBucket: "proposalData",
        },
        {
          name: "expectedDeliverables",
          fieldType: "multiselect",
          label: "Expected deliverables",
          helperText: "Pick everything that applies.",
          storage: "json_bucket",
          storageBucket: "proposalData",
          options: DELIVERABLE_OPTIONS,
        },
        {
          name: "expectedDeliverablesOther",
          fieldType: "text",
          label: "If \"Other\" deliverable, please specify",
          storage: "json_bucket",
          storageBucket: "proposalData",
        },
        {
          name: "anticipatedObstacles",
          fieldType: "textarea",
          label: "Anticipated obstacles",
          helperText: "Up to 100 words.",
          storage: "json_bucket",
          storageBucket: "proposalData",
          validation: { wordLimit: 100 },
        },
        {
          name: "fieldResearchRequired",
          fieldType: "select",
          label: "Is field research required?",
          storage: "json_bucket",
          storageBucket: "proposalData",
          options: FIELD_RESEARCH_OPTIONS,
        },
        {
          name: "fieldResearchTravelDetails",
          fieldType: "text",
          label: "If yes, describe travel / fieldwork",
          storage: "json_bucket",
          storageBucket: "proposalData",
        },
        {
          name: "requiredSoftware",
          fieldType: "multiselect",
          label: "Required software / tooling",
          helperText: "Pick \"Team discretion\" if students should choose.",
          storage: "json_bucket",
          storageBucket: "proposalData",
          options: SOFTWARE_OPTIONS,
        },
        {
          name: "requiredSoftwareOther",
          fieldType: "text",
          label: "If \"Other\" software, please specify",
          storage: "json_bucket",
          storageBucket: "proposalData",
        },
        {
          name: "requiredHardware",
          fieldType: "multiselect",
          label: "Required hardware",
          storage: "json_bucket",
          storageBucket: "proposalData",
          options: HARDWARE_OPTIONS,
        },
        {
          name: "requiredHardwareOther",
          fieldType: "text",
          label: "If \"Other\" hardware, please specify",
          storage: "json_bucket",
          storageBucket: "proposalData",
        },
        {
          name: "additionalNotes",
          fieldType: "textarea",
          label: "Anything else we should know?",
          storage: "json_bucket",
          storageBucket: "proposalData",
        },
        {
          name: "internshipInterest",
          fieldType: "select",
          label: "Are you open to hosting an internship if the match works out?",
          storage: "json_bucket",
          storageBucket: "proposalData",
          options: INTERNSHIP_INTEREST_OPTIONS,
        },
      ],
    },
    {
      title: "Project scope (post-acceptance)",
      description:
        "Fill these in once the project is accepted — they shape the student-facing brief.",
      visibleWhenStatus: ["accepted", "published", "closed"],
      fields: [
        {
          name: "scopeDescription",
          fieldType: "textarea",
          label: "Scope description",
          isRequired: true,
          storage: "column",
          storageColumn: "scopeDescription",
          validation: { wordLimit: 500 },
        },
        {
          name: "potentialActivities",
          fieldType: "textarea",
          label: "Potential activities",
          storage: "column",
          storageColumn: "potentialActivities",
          validation: { wordLimit: 500 },
        },
        {
          name: "specificSkills",
          fieldType: "textarea",
          label: "Specific skills the team will need",
          storage: "column",
          storageColumn: "specificSkills",
          validation: { wordLimit: 500 },
        },
      ],
    },
    {
      title: "Availability & capacity",
      fields: [
        {
          name: "availableFrom",
          fieldType: "date",
          label: "Available from",
          storage: "column",
          storageColumn: "availableFrom",
        },
        {
          name: "availableTo",
          fieldType: "date",
          label: "Available to",
          storage: "column",
          storageColumn: "availableTo",
        },
        {
          name: "timeCommitment",
          fieldType: "text",
          label: "Time commitment",
          placeholder: "e.g. 3 hours per week for 8 weeks",
          storage: "column",
          storageColumn: "timeCommitment",
        },
        {
          name: "studentCapacity",
          fieldType: "number",
          label: "Student capacity",
          storage: "column",
          storageColumn: "studentCapacity",
          validation: { min: 1 },
          defaultValue: 1,
        },
        {
          name: "teamSize",
          fieldType: "number",
          label: "Team size",
          storage: "column",
          storageColumn: "teamSize",
          validation: { min: 1 },
          defaultValue: 1,
        },
        {
          name: "allowsTeamPreferences",
          fieldType: "checkbox",
          label: "Allow students to submit teammate preferences",
          storage: "column",
          storageColumn: "allowsTeamPreferences",
        },
        {
          name: "preferGroupFormat",
          fieldType: "select",
          label: "Preferred group format",
          storage: "column",
          storageColumn: "preferGroupFormat",
          options: PREFER_GROUP_FORMAT_OPTIONS,
        },
      ],
    },
    {
      title: "Audience preferences",
      fields: [
        {
          name: "preferGradeLevels",
          fieldType: "multiselect",
          label: "Preferred grade levels",
          storage: "column",
          storageColumn: "preferGradeLevels",
          options: PREFER_GRADE_LEVELS_OPTIONS,
        },
        {
          name: "preferClassType",
          fieldType: "multiselect",
          label: "Preferred class types",
          storage: "column",
          storageColumn: "preferClassType",
          options: PREFER_CLASS_TYPE_OPTIONS,
        },
      ],
    },
    {
      title: "Sponsor mentor",
      description:
        "If you'll be the day-to-day mentor for matched students, leave this checked.",
      fields: [
        {
          name: "sponsorIsMentor",
          fieldType: "checkbox",
          label: "I will mentor the matched team",
          storage: "column",
          storageColumn: "sponsorIsMentor",
          defaultValue: true,
        },
        {
          name: "mentorNotes",
          fieldType: "textarea",
          label: "Mentor notes (only if someone else will mentor)",
          storage: "column",
          storageColumn: "mentorNotes",
        },
      ],
    },
    {
      title: "Publishing",
      description:
        "Set status to \"Submitted for review\" when you're ready for the team at MindHive to take a look.",
      roleVisibility: ["sponsor"],
      fields: [
        {
          name: "status",
          fieldType: "select",
          label: "Status",
          storage: "column",
          storageColumn: "status",
          options: STATUS_OPTIONS_SPONSOR,
          isRequired: true,
        },
        // Renders the proposal-guidelines statement + clickable link
        // chips. Admins can edit the helperText (HTML) to swap URLs or
        // add more documents.
        {
          name: "proposal_guidelines_info",
          fieldType: "read_only_html",
          label: "Understanding of Proposal Guidelines",
          helperText: GUIDELINES_HTML,
          storage: "json_bucket",
          storageBucket: "extraDetails",
        },
        {
          name: "guidelinesAcknowledged",
          fieldType: "checkbox",
          label: "I agree with this statement.",
          storage: "column",
          storageColumn: "guidelinesAcknowledged",
        },
        {
          name: "requestsAppointment",
          fieldType: "checkbox",
          label: "I request an appointment to discuss further.",
          storage: "column",
          storageColumn: "requestsAppointment",
        },
      ],
    },
    {
      title: "Publishing (admin)",
      description: "Admin status controls — full status set available.",
      roleVisibility: ["admin"],
      fields: [
        {
          name: "status",
          fieldType: "select",
          label: "Status",
          storage: "column",
          storageColumn: "status",
          options: STATUS_OPTIONS_ADMIN,
          isRequired: true,
        },
        {
          name: "proposal_guidelines_info_admin",
          fieldType: "read_only_html",
          label: "Proposal guidelines (sponsor-facing)",
          helperText: GUIDELINES_HTML,
          storage: "json_bucket",
          storageBucket: "extraDetails",
        },
        {
          name: "guidelinesAcknowledged",
          fieldType: "checkbox",
          label: "Sponsor has acknowledged guidelines",
          storage: "column",
          storageColumn: "guidelinesAcknowledged",
        },
        {
          name: "requestsAppointment",
          fieldType: "checkbox",
          label: "Sponsor requested an appointment",
          storage: "column",
          storageColumn: "requestsAppointment",
        },
      ],
    },
  ],
};
