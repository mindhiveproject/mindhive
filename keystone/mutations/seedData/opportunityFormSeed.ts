// Seed payload for the global Opportunity FormDefinition.
// Exported from the local published Capstone global form
// (FormDefinition id cmr2fzwo2004limsc6mpbciu9) on 2026-08-14.
//
// Consumed by mutations/seedOpportunityForm.ts which inserts
// FormDefinition + FormCard + FormField rows.

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
  { value: "org_no_restrictions", label: "Our organization will provide data — no special restrictions" },
  { value: "org_privacy_nda", label: "Our organization will provide data — privacy / NDA required" },
  { value: "other", label: "Other (please describe)" }
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
  { value: "other", label: "Other" }
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
  { value: "other", label: "Other" }
];

const HARDWARE_OPTIONS: Option[] = [
  { value: "team_discretion", label: "Team discretion" },
  { value: "microcontrollers", label: "Microcontrollers" },
  { value: "sensors", label: "Sensors" },
  { value: "cameras_cv", label: "Cameras / CV" },
  { value: "gpu_access", label: "GPU access" },
  { value: "other", label: "Other" }
];

const YES_NO_OPTIONS: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" }
];

const INTERNSHIP_OPTIONS: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "maybe", label: "Maybe" }
];

const PROJECT_CATEGORY_OPTIONS: Option[] = [
  { value: "urban_health", label: "Urban health" },
  { value: "urban_environment", label: "Urban environment" },
  { value: "urban_infrastructure", label: "Urban infrastructure" },
  { value: "other", label: "Other" }
];

const PREFER_GROUP_FORMAT_OPTIONS: Option[] = [
  { value: "individual", label: "Individual only" },
  { value: "team", label: "Team only" },
  { value: "either", label: "Either" }
];

const STATUS_OPTIONS_ADMIN: Option[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Submitted for review" },
  { value: "returned", label: "Returned" },
  { value: "pre_selected", label: "Pre-selected" },
  { value: "accepted", label: "Accepted" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" }
];

const FIELD_RESEARCH_OPTIONS: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "beneficial", label: "Beneficial but not required" }
];

// Sponsor Publishing card — guidelines statement + DesignSystem-style chips.
const SPONSOR_GUIDELINES_HTML = "<style>\n.mh-ds-chip:hover { background-color: #f3f3f3 !important; }\n.mh-ds-chip:focus-visible { outline: 2px solid #336f8a; outline-offset: 2px; }\n</style>\n<p style=\"margin:0 0 12px;color:#171717;font-family:Inter,sans-serif;font-size:14px;line-height:1.5;\">I have read and understood the Capstone proposal guidelines in full, including all of the Capstone Sponsor FAQs and Mutual Expectations agreement and agree to abide by them.</p>\n<div style=\"display:flex;gap:8px;flex-wrap:wrap;align-items:center;\">\n  <a class=\"mh-ds-chip\" href=\"https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display:inline-flex;align-items:center;gap:8px;height:32px;padding:6px 12px 6px 4px;border:1px solid #a1a1a1;border-radius:8px;background:#ffffff;color:#171717;text-decoration:none;font-family:Inter,sans-serif;font-weight:600;font-size:14px;line-height:20px;box-sizing:border-box;white-space:nowrap;cursor:pointer;\">\n    <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\" style=\"flex-shrink:0;display:block;\"><path d=\"M8 13H16V11H8V13ZM8 16H16V14H8V16ZM8 19H13V17H8V19ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H14L20 8V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 9V4H6V20H18V9H13Z\" fill=\"currentColor\"/></svg>\n    <span>Capstone Sponsor FAQs</span>\n  </a>\n  <a class=\"mh-ds-chip\" href=\"https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects/cusp-capstone-mutual-expectations\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display:inline-flex;align-items:center;gap:8px;height:32px;padding:6px 12px 6px 4px;border:1px solid #a1a1a1;border-radius:8px;background:#ffffff;color:#171717;text-decoration:none;font-family:Inter,sans-serif;font-weight:600;font-size:14px;line-height:20px;box-sizing:border-box;white-space:nowrap;cursor:pointer;\">\n    <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\" style=\"flex-shrink:0;display:block;\"><path d=\"M8 13H16V11H8V13ZM8 16H16V14H8V16ZM8 19H13V17H8V19ZM6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H14L20 8V20C20 20.55 19.8042 21.0208 19.4125 21.4125C19.0208 21.8042 18.55 22 18 22H6ZM13 9V4H6V20H18V9H13Z\" fill=\"currentColor\"/></svg>\n    <span>Mutual Expectations agreement</span>\n  </a>\n</div>";

// Admin Publishing card — legacy chip HTML (admin preview of sponsor-facing copy).
const ADMIN_GUIDELINES_HTML = "<p style=\"margin:0 0 12px;color:#171717;font-size:14px;line-height:1.5;\">I have read and understood the Capstone proposal guidelines in full, including all of the Capstone Sponsor FAQs and Mutual Expectations agreement and agree to abide by them.</p><div style=\"display:flex;gap:8px;flex-wrap:wrap;\"><a href=\"https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid #d3dae0;border-radius:100px;background:#ffffff;color:#336f8a;text-decoration:none;font-weight:600;font-size:13px;font-family:Nunito,sans-serif;\">📄 Capstone Sponsor FAQs</a><a href=\"https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects/cusp-capstone-mutual-expectations\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid #d3dae0;border-radius:100px;background:#ffffff;color:#336f8a;text-decoration:none;font-weight:600;font-size:13px;font-family:Nunito,sans-serif;\">📄 Mutual Expectations agreement</a></div>";

export const OPPORTUNITY_FORM_SEED: FormSeed = {
  key: "opportunity",
  title: "Opportunity (Capstone) — global form",
  description:
    "Default global form used to create and edit Connect Opportunities. Admins can clone this for per-organization variants.",
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
      description: "Upload a cover image and/or paste a YouTube / Vimeo / Loom / Google Drive link for an intro video.",
      fields: [
        {
          name: "coverImage",
          fieldType: "image",
          label: "Cover image",
          helperText: "Upload a JPG / PNG (max ~10MB). Shown in browse lists and at the top of the detail page.",
          storage: "column",
          storageColumn: "coverImage",
          validation: {
            maxFileSize: 10485760
          },
        },
        {
          name: "coverImageUrl",
          fieldType: "text",
          label: "Or paste an image URL",
          helperText: "Used only when no upload is provided. The upload takes priority.",
          placeholder: "https://…",
          storage: "column",
          storageColumn: "coverImageUrl",
        },
        {
          name: "videoFile",
          fieldType: "file",
          label: "Intro video file",
          helperText: "Upload an MP4 / WebM (max ~500MB). Used when no embed URL is set.",
          storage: "column",
          storageColumn: "videoFile",
          validation: {
            maxFileSize: 524288000,
            allowedMimes: "video/mp4,video/webm"
          },
        },
        {
          name: "videoUrl",
          fieldType: "video_url",
          label: "Or paste a video URL / embed",
          helperText: "YouTube, Vimeo, Loom, or Google Drive. A live preview will appear below.",
          placeholder: "https://youtube.com/watch?v=…",
          storage: "column",
          storageColumn: "videoUrl",
        },
      ],
    },
    {
      title: "Capstone proposal overview",
      description: "Detailed proposal narrative — datasets, deliverables, tooling, and any obstacles you foresee.",
      fields: [
        {
          name: "relevance",
          fieldType: "textarea",
          label: "Why does this project matter?",
          helperText: "Up to 250 words.",
          storage: "json_bucket",
          storageBucket: "proposalData",
          validation: {
            wordLimit: 250
          },
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
          validation: {
            wordLimit: 100
          },
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
          options: INTERNSHIP_OPTIONS,
        },
      ],
    },
    {
      title: "Project scope (post-acceptance)",
      description: "Fill these in once the project is accepted — they shape the student-facing brief.",
      visibleWhenStatus: [
        "accepted",
        "published",
        "closed"
      ],
      fields: [
        {
          name: "scopeDescription",
          fieldType: "textarea",
          label: "Scope description",
          isRequired: true,
          storage: "column",
          storageColumn: "scopeDescription",
          validation: {
            wordLimit: 500
          },
        },
        {
          name: "potentialActivities",
          fieldType: "textarea",
          label: "Potential activities",
          storage: "column",
          storageColumn: "potentialActivities",
          validation: {
            wordLimit: 500
          },
        },
        {
          name: "specificSkills",
          fieldType: "textarea",
          label: "Specific skills the team will need",
          storage: "column",
          storageColumn: "specificSkills",
          validation: {
            wordLimit: 500
          },
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
          validation: {
            min: 1
          },
          defaultValue: 1,
        },
        {
          name: "teamSize",
          fieldType: "number",
          label: "Team size",
          storage: "column",
          storageColumn: "teamSize",
          validation: {
            min: 1
          },
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
      title: "Sponsor mentor",
      description: "If you'll be the day-to-day mentor for matched students, leave this checked.",
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
      description: "Set status to \"Submitted for review\" when you're ready for the team at MindHive to take a look.",
      roleVisibility: [
        "sponsor"
      ],
      fields: [
        {
          name: "proposal_guidelines_info",
          fieldType: "read_only_html",
          label: "Understanding of Proposal Guidelines",
          helperText: SPONSOR_GUIDELINES_HTML,
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
      roleVisibility: [
        "admin"
      ],
      fields: [
        {
          name: "status",
          fieldType: "select",
          label: "Status",
          isRequired: true,
          storage: "column",
          storageColumn: "status",
          options: STATUS_OPTIONS_ADMIN,
        },
        {
          name: "proposal_guidelines_info_admin",
          fieldType: "read_only_html",
          label: "Proposal guidelines (sponsor-facing)",
          helperText: ADMIN_GUIDELINES_HTML,
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
