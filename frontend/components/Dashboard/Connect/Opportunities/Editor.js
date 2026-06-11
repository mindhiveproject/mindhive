import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import useForm from "../../../../lib/useForm";
import useEmail from "../../../../lib/useEmail";
import {
  GET_OPPORTUNITY,
  MY_CLASS_NETWORKS_FOR_OPPORTUNITY,
  MY_OPPORTUNITIES,
} from "../../../Queries/Opportunity";
import { QUESTIONS_FOR_OPPORTUNITY } from "../../../Queries/ConnectQuestion";
import { GET_MY_ORGANIZATION } from "../../../Queries/Organization";
import {
  CREATE_OPPORTUNITY,
  UPDATE_OPPORTUNITY,
} from "../../../Mutations/Opportunity";
import {
  CREATE_QUESTION,
  DELETE_QUESTION,
} from "../../../Mutations/ConnectQuestion";
import { deriveRoles } from "../useConnectRole";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    color: #171717;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }
`;

const Row = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: ${({ $cols }) => $cols || "1fr"};

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "Lato", sans-serif;
  font-size: 14px;
  color: #5f6871;

  span.label-text {
    font-weight: 600;
    color: #171717;
  }

  span.hint {
    color: #888;
    font-size: 12px;
  }

  input[type="text"],
  input[type="number"],
  input[type="date"],
  textarea {
    padding: 10px 14px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    outline: none;

    &:focus {
      border-color: #336f8a;
    }
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid #d3dae0;
    border-radius: 100px;
    background: #ffffff;
    cursor: pointer;
    font-size: 13px;
  }

  label.active {
    background: #336f8a;
    color: #ffffff;
    border-color: #336f8a;
  }

  input {
    display: none;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 100px;
  border: 1px solid ${({ $primary }) => ($primary ? "#336f8a" : "#d3dae0")};
  background: ${({ $primary }) => ($primary ? "#336f8a" : "#ffffff")};
  color: ${({ $primary }) => ($primary ? "#ffffff" : "#336f8a")};
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GRADE_OPTIONS = [
  { value: "middle", label: "Middle School" },
  { value: "nine", label: "9 - 10 Grade" },
  { value: "eleven", label: "11 - 12 Grade" },
];

const CLASS_TYPE_OPTIONS = [
  { value: "accelerated", label: "Accelerated" },
  { value: "nonAccelerated", label: "Non-Accelerated" },
  { value: "ell", label: "ELL" },
];

const GROUP_FORMAT_OPTIONS = [
  { key: "individual", text: "Individual", value: "individual" },
  { key: "team", text: "Team", value: "team" },
  { key: "either", text: "Either", value: "either" },
];

const CATEGORY_OPTIONS = [
  { value: "urban_health", key: "urbanHealth" },
  { value: "urban_environment", key: "urbanEnvironment" },
  { value: "urban_infrastructure", key: "urbanInfrastructure" },
  { value: "other", key: "other" },
];

const DATA_SECURITY_OPTIONS = ["yes", "maybe", "no"];

const WORD_LIMITS = {
  title: 15,
  shortDescription: 100,
  issueRelevance: 100,
  expectedDeliverables: 250,
  designedForSpecificStudents: 15,
  anticipatedObstacles: 250,
  requiresBusinessHours: 50,
  privateClientDataNotes: 100,
  fieldResearchTravelDetails: 250,
  potentialActivities: 500,
  specificSkills: 500,
  scopeDescription: 500,
};

const SPONSOR_LOCKED_STATUSES = new Set([
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "archived",
]);

const EMPTY_FORM = {
  title: "",
  shortDescription: "",
  description: "",
  projectCategory: "",
  projectCategoryOther: "",
  coverImageUrl: "",
  videoUrl: "",
  availableFrom: "",
  availableTo: "",
  timeCommitment: "",
  studentCapacity: 1,
  teamSize: 1,
  allowsTeamPreferences: false,
  preferGroupFormat: "either",
  status: "draft",
  // CUSP capstone fields
  sponsorIsMentor: true,
  mentorNotes: "",
  researchQuestion: "",
  relevance: "",
  dataRequirements: "",
  backgroundMethodology: "",
  dataSecurityConcerns: "no",
  dataSecurityNotes: "",
  techRequirements: "",
  fieldWorkLikelihood: 1,
  competencies: "",
  learningOutcomes: "",
  additionalNotes: "",
  guidelinesAcknowledged: false,
  requestsAppointment: false,
  // Special considerations (proposal-time)
  specialConsiderations: "",
  designedForSpecificStudents: "",
  anticipatedObstacles: "",
  requiresBusinessHours: "",
  privateClientDataNotes: "",
  fieldResearchTravelDetails: "",
  expectedDeliverables: "",
  // Post-acceptance details (only after admin accepts)
  scopeDescription: "",
  issueRelevance: "",
  potentialActivities: "",
  specificSkills: "",
};

function wordCount(value) {
  if (!value) return 0;
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function exceedsWordLimit(value, max) {
  return wordCount(value) > max;
}

function StatusBanner({ children, variant = "success" }) {
  const styles =
    variant === "success"
      ? {
          background: "#e3f4ec",
          border: "1px solid #b6dec7",
          color: "#1d6b3a",
        }
      : {
          background: "#eef5f9",
          border: "1px solid #c5dde8",
          color: "#336f8a",
        };
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: 13,
        ...styles,
      }}
    >
      {children}
    </div>
  );
}

function RequiredMark() {
  return <span style={{ color: "#b3261e" }}> *</span>;
}

function WordHint({ value, max }) {
  const { t } = useTranslation("connect");
  const count = wordCount(value);
  const over = count > max;
  return (
    <span
      className="hint"
      style={{ color: over ? "#b3261e" : "#888", fontSize: 11 }}
    >
      {t("opportunityEditor.wordCountTemplate", { count, max }, {
        default: "{{count}} / {{max}} words",
      })}{" "}
      {over
        ? t("opportunityEditor.wordCountOver", {}, { default: "— consider trimming" })
        : ""}
    </span>
  );
}

const LinkChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;

  a {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border: 1px solid #d3dae0;
    border-radius: 100px;
    background: #ffffff;
    color: #336f8a;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 13px;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      background: #eef5f9;
      border-color: #336f8a;
    }
  }
`;

const ScaleRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .scale-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
  }

  .scale-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .scale-btn {
    flex: 1;
    min-width: 40px;
    padding: 8px 0;
    border: 1px solid #d3dae0;
    border-radius: 8px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    cursor: pointer;
    text-align: center;

    &.active {
      background: #336f8a;
      color: #ffffff;
      border-color: #336f8a;
    }
  }
`;

function toDateInputValue(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function toIsoOrNull(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

export default function OpportunityEditor({ opportunityId, user }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const { sendEmail } = useEmail();
  const isNew = opportunityId === "new";
  const isReviewRoute = router.query?.review === "1";
  const { hasExpandedOpportunityEditor, isAdmin, isTeacher } = deriveRoles(user);

  // Sponsors decide between drafting and submitting for review. Everything
  // beyond — accepting, publishing, closing — is reserved for admins so a
  // sponsor can't unilaterally accept or publish their own opportunity.
  const sponsorStatusOptions = [
    {
      key: "draft",
      text: t("opportunityEditor.statusOptions.draft", {}, {
        default: "Draft (not visible to students)",
      }),
      value: "draft",
    },
    {
      key: "pending_review",
      text: t("opportunityEditor.statusOptions.submitted", {}, {
        default: "Submitted for review",
      }),
      value: "pending_review",
    },
  ];

  const adminStatusOptions = [
    ...sponsorStatusOptions,
    {
      key: "pre_selected",
      text: t("opportunityEditor.statusOptions.pre_selected", {}, {
        default: "Pre-selected (complete follow-up questions)",
      }),
      value: "pre_selected",
    },
    {
      key: "accepted",
      text: t("opportunityEditor.statusOptions.accepted", {}, {
        default: "Accepted (complete final scope)",
      }),
      value: "accepted",
    },
    {
      key: "published",
      text: t("opportunityEditor.statusOptions.published", {}, {
        default: "Published",
      }),
      value: "published",
    },
    {
      key: "closed",
      text: t("opportunityEditor.statusOptions.closed", {}, {
        default: "Closed",
      }),
      value: "closed",
    },
    {
      key: "archived",
      text: t("opportunityEditor.statusOptions.archived", {}, {
        default: "Archived",
      }),
      value: "archived",
    },
  ];

  const statusOptions = isAdmin ? adminStatusOptions : sponsorStatusOptions;
  const ADMIN_ONLY_STATUSES = SPONSOR_LOCKED_STATUSES;

  const { data: existing, loading: loadingOpportunity } = useQuery(
    GET_OPPORTUNITY,
    {
      variables: { id: opportunityId },
      skip: isNew,
      fetchPolicy: "cache-and-network",
    }
  );

  const { data: networksData } = useQuery(MY_CLASS_NETWORKS_FOR_OPPORTUNITY);
  const allNetworks = networksData?.classNetworks || [];

  // The current user's first Organization — auto-attached to new opportunities
  // so sponsors don't have to pick their own org on every create.
  const { data: myOrgData } = useQuery(GET_MY_ORGANIZATION);
  const myOrganizationId =
    myOrgData?.authenticatedItem?.organizations?.[0]?.id || null;

  const opportunity = existing?.opportunity;

  const isReviewMode =
    !isNew &&
    isReviewRoute &&
    (isTeacher || isAdmin) &&
    opportunity?.mentor?.id &&
    opportunity.mentor.id !== user?.id;
  const isFieldReadOnly = isReviewMode && !isAdmin;

  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedClassTypes, setSelectedClassTypes] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);

  const [coverImageUpload, setCoverImageUpload] = useState(null);
  const [videoFileUpload, setVideoFileUpload] = useState(null);

  const MAX_COVER_BYTES = 10 * 1024 * 1024; // 10 MB
  const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

  // Tolerant URL validator: accepts http/https, returns a friendly hint when
  // the input looks wrong. Used as a non-blocking warning.
  const urlHint = (raw) => {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    if (/^<iframe/i.test(trimmed)) {
      return "This looks like an embed code. Paste just the URL — we'll embed it for you.";
    }
    try {
      const u = new URL(trimmed);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return "URL should start with http:// or https://";
      }
      return null;
    } catch {
      return "That doesn't look like a valid URL.";
    }
  };

  const pickCoverImage = (file) => {
    if (!file) {
      setCoverImageUpload(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please pick an image file (JPG, PNG, WEBP, etc.).");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      alert(
        `Cover image is too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum is ${MAX_COVER_BYTES / 1024 / 1024} MB. Compress it or pick a smaller image.`,
      );
      return;
    }
    setCoverImageUpload(file);
  };

  const pickVideoFile = (file) => {
    if (!file) {
      setVideoFileUpload(null);
      return;
    }
    if (!file.type.startsWith("video/")) {
      alert("Please pick a video file (MP4, WEBM, MOV, etc.).");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      alert(
        `Video is too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum is ${MAX_VIDEO_BYTES / 1024 / 1024} MB. Either compress the video or paste a YouTube / Vimeo / Loom URL below.`,
      );
      return;
    }
    setVideoFileUpload(file);
  };

  const [questionDraft, setQuestionDraft] = useState({
    prompt: "",
    questionType: "short_text",
    optionsText: "",
    isRequired: false,
  });

  const { data: questionsData, refetch: refetchQuestions } = useQuery(
    QUESTIONS_FOR_OPPORTUNITY,
    {
      variables: { opportunityId },
      skip: isNew,
      fetchPolicy: "cache-and-network",
    }
  );
  const opportunityQuestions = questionsData?.connectQuestions || [];

  const [createQuestion, { loading: addingQuestion }] = useMutation(
    CREATE_QUESTION
  );
  const [deleteQuestion] = useMutation(DELETE_QUESTION);

  const { inputs, handleChange, handleMultipleUpdate, toggleBoolean } = useForm(
    EMPTY_FORM
  );

  const showFollowUp =
    ["pre_selected", "accepted", "published", "closed"].includes(
      inputs.status,
    ) || !!opportunity?.preSelectedAt;
  const showFinalScope =
    ["accepted", "published", "closed"].includes(inputs.status) ||
    !!opportunity?.acceptedAt;
  const fieldDisabled = isFieldReadOnly;

  const [relevantLinks, setRelevantLinks] = useState([]);

  useEffect(() => {
    if (!opportunity) return;
    handleMultipleUpdate({
      title: opportunity.title || "",
      shortDescription: opportunity.shortDescription || "",
      description: opportunity.description || "",
      projectCategory: opportunity.projectCategory || "",
      projectCategoryOther: opportunity.projectCategoryOther || "",
      coverImageUrl: opportunity.coverImageUrl || "",
      videoUrl: opportunity.videoUrl || "",
      availableFrom: toDateInputValue(opportunity.availableFrom),
      availableTo: toDateInputValue(opportunity.availableTo),
      timeCommitment: opportunity.timeCommitment || "",
      studentCapacity: opportunity.studentCapacity ?? 1,
      teamSize: opportunity.teamSize ?? 1,
      allowsTeamPreferences: !!opportunity.allowsTeamPreferences,
      preferGroupFormat: opportunity.preferGroupFormat || "either",
      status: opportunity.status || "draft",
      // CUSP capstone fields
      sponsorIsMentor: opportunity.sponsorIsMentor ?? true,
      mentorNotes: opportunity.mentorNotes || "",
      researchQuestion: opportunity.researchQuestion || "",
      relevance: opportunity.relevance || "",
      dataRequirements: opportunity.dataRequirements || "",
      backgroundMethodology: opportunity.backgroundMethodology || "",
      dataSecurityConcerns: opportunity.dataSecurityConcerns || "no",
      dataSecurityNotes: opportunity.dataSecurityNotes || "",
      techRequirements: opportunity.techRequirements || "",
      fieldWorkLikelihood: opportunity.fieldWorkLikelihood ?? 1,
      competencies: opportunity.competencies || "",
      learningOutcomes: opportunity.learningOutcomes || "",
      additionalNotes: opportunity.additionalNotes || "",
      guidelinesAcknowledged: !!opportunity.guidelinesAcknowledged,
      requestsAppointment: !!opportunity.requestsAppointment,
      // Special considerations
      specialConsiderations: opportunity.specialConsiderations || "",
      designedForSpecificStudents:
        opportunity.designedForSpecificStudents || "",
      anticipatedObstacles: opportunity.anticipatedObstacles || "",
      requiresBusinessHours: opportunity.requiresBusinessHours || "",
      privateClientDataNotes: opportunity.privateClientDataNotes || "",
      fieldResearchTravelDetails:
        opportunity.fieldResearchTravelDetails || "",
      expectedDeliverables: opportunity.expectedDeliverables || "",
      // Post-acceptance details
      scopeDescription: opportunity.scopeDescription || "",
      issueRelevance: opportunity.issueRelevance || "",
      potentialActivities: opportunity.potentialActivities || "",
      specificSkills: opportunity.specificSkills || "",
    });
    setSelectedGrades(opportunity.preferGradeLevels || []);
    setSelectedClassTypes(opportunity.preferClassType || []);
    setSelectedNetworks(
      (opportunity.classNetworks || []).map((n) => n.id)
    );
    setRelevantLinks(
      Array.isArray(opportunity.relevantLinks) ? opportunity.relevantLinks : []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity?.id]);

  const [createOpportunity, { loading: creating }] = useMutation(
    CREATE_OPPORTUNITY,
    {
      refetchQueries: [{ query: MY_OPPORTUNITIES }],
    }
  );
  const [updateOpportunity, { loading: updating }] = useMutation(
    UPDATE_OPPORTUNITY,
    {
      refetchQueries: isNew
        ? [{ query: MY_OPPORTUNITIES }]
        : [
            { query: MY_OPPORTUNITIES },
            { query: GET_OPPORTUNITY, variables: { id: opportunityId } },
          ],
      awaitRefetchQueries: true,
    }
  );

  const saving = creating || updating;

  const toggleGrade = (value) => {
    setSelectedGrades((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleClassType = (value) => {
    setSelectedClassTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const SELECT_TYPES = ["single_select", "multi_select"];

  const handleAddQuestion = async () => {
    if (!questionDraft.prompt?.trim()) {
      alert("Question prompt is required.");
      return;
    }
    const needsOptions = SELECT_TYPES.includes(questionDraft.questionType);
    const options = needsOptions
      ? questionDraft.optionsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((label) => ({ label, value: label }))
      : null;
    if (needsOptions && (!options || options.length === 0)) {
      alert("Provide at least one option for a select question.");
      return;
    }
    await createQuestion({
      variables: {
        input: {
          prompt: questionDraft.prompt,
          questionType: questionDraft.questionType,
          options,
          scope: "opportunity",
          opportunity: { connect: { id: opportunityId } },
          status: "approved",
          isRequired: !!questionDraft.isRequired,
          weight: 1.0,
          order: opportunityQuestions.length,
        },
      },
    });
    setQuestionDraft({
      prompt: "",
      questionType: "short_text",
      optionsText: "",
      isRequired: false,
    });
    refetchQuestions();
  };

  const handleDeleteQuestion = async (id) => {
    if (
      !window.confirm(
        t("opportunityEditor.customQuestions.deleteConfirm", {}, {
          default: "Delete this question?",
        }),
      )
    )
      return;
    await deleteQuestion({ variables: { id } });
    refetchQuestions();
  };

  const validateWordLimits = () => {
    const checks = [
      ["title", inputs.title, WORD_LIMITS.title],
      ["shortDescription", inputs.shortDescription, WORD_LIMITS.shortDescription],
      ["issueRelevance", inputs.issueRelevance, WORD_LIMITS.issueRelevance],
      [
        "expectedDeliverables",
        inputs.expectedDeliverables,
        WORD_LIMITS.expectedDeliverables,
      ],
      [
        "designedForSpecificStudents",
        inputs.designedForSpecificStudents,
        WORD_LIMITS.designedForSpecificStudents,
      ],
      [
        "anticipatedObstacles",
        inputs.anticipatedObstacles,
        WORD_LIMITS.anticipatedObstacles,
      ],
      [
        "requiresBusinessHours",
        inputs.requiresBusinessHours,
        WORD_LIMITS.requiresBusinessHours,
      ],
      [
        "privateClientDataNotes",
        inputs.privateClientDataNotes,
        WORD_LIMITS.privateClientDataNotes,
      ],
      [
        "fieldResearchTravelDetails",
        inputs.fieldResearchTravelDetails,
        WORD_LIMITS.fieldResearchTravelDetails,
      ],
      [
        "potentialActivities",
        inputs.potentialActivities,
        WORD_LIMITS.potentialActivities,
      ],
      ["specificSkills", inputs.specificSkills, WORD_LIMITS.specificSkills],
      [
        "scopeDescription",
        inputs.scopeDescription,
        WORD_LIMITS.scopeDescription,
      ],
    ];
    for (const [field, value, max] of checks) {
      if (exceedsWordLimit(value, max)) {
        alert(
          t("opportunityEditor.validation.wordLimit", { field, max }, {
            default: "{{field}} exceeds the {{max}}-word limit.",
          }),
        );
        return false;
      }
    }
    return true;
  };

  const validateSponsorSubmission = () => {
    const checks = [
      [!inputs.shortDescription?.trim(), "validation.projectAbstract"],
      [!inputs.projectCategory, "validation.category"],
      [
        inputs.projectCategory === "other" && !inputs.projectCategoryOther?.trim(),
        "validation.categoryOther",
      ],
      [!inputs.issueRelevance?.trim(), "validation.issueRelevance"],
      [!inputs.expectedDeliverables?.trim(), "validation.expectedDeliverables"],
    ];
    for (const [failed, key] of checks) {
      if (failed) {
        alert(
          t(`opportunityEditor.${key}`, {}, {
            default: "Please complete all required fields.",
          }),
        );
        return false;
      }
    }
    return validateWordLimits();
  };

  const validateFollowUpComplete = () => {
    if (!inputs.potentialActivities?.trim() || !inputs.specificSkills?.trim()) {
      alert(
        t("opportunityEditor.validation.followUpIncomplete", {}, {
          default: "Please complete the follow-up questionnaire before saving.",
        }),
      );
      return false;
    }
    return validateWordLimits();
  };

  const validateScopeComplete = () => {
    if (!inputs.scopeDescription?.trim()) {
      alert(
        t("opportunityEditor.validation.scopeDescription", {}, {
          default: "Project scope is required.",
        }),
      );
      return false;
    }
    return validateWordLimits();
  };

  const handleSave = async () => {
    if (!inputs.title?.trim()) {
      alert(
        t("opportunityEditor.validation.title", {}, { default: "Title is required." }),
      );
      return;
    }
    if (exceedsWordLimit(inputs.title, WORD_LIMITS.title)) {
      return validateWordLimits();
    }
    if (inputs.status === "pending_review" && !validateSponsorSubmission()) {
      return;
    }
    if (
      showFollowUp &&
      ["pre_selected", "accepted", "published"].includes(inputs.status) &&
      !validateFollowUpComplete()
    ) {
      return;
    }
    if (
      showFinalScope &&
      ["accepted", "published"].includes(inputs.status) &&
      !validateScopeComplete()
    ) {
      return;
    }
    if (!validateWordLimits()) return;
    // Acknowledgment is required for any progression past Draft — both when a
    // sponsor submits for review AND when an admin publishes. Keeps the
    // mutual-expectations check at the gate of the first non-draft state.
    if (inputs.status !== "draft" && !inputs.guidelinesAcknowledged) {
      alert(
        t("opportunityEditor.validation.guidelines", {}, {
          default:
            "Please tick the guidelines acknowledgment in the Publishing card before changing the status away from Draft.",
        }),
      );
      return;
    }

    const networkConnect = selectedNetworks.map((id) => ({ id }));

    const baseInput = {
      title: inputs.title,
      shortDescription: inputs.shortDescription || "",
      description: inputs.description || "",
      projectCategory: inputs.projectCategory || null,
      projectCategoryOther:
        inputs.projectCategory === "other"
          ? inputs.projectCategoryOther || ""
          : "",
      coverImageUrl: inputs.coverImageUrl || "",
      videoUrl: inputs.videoUrl || "",
      availableFrom: toIsoOrNull(inputs.availableFrom),
      availableTo: toIsoOrNull(inputs.availableTo),
      timeCommitment: inputs.timeCommitment || "",
      studentCapacity: Number(inputs.studentCapacity) || 1,
      teamSize: Number(inputs.teamSize) || 1,
      allowsTeamPreferences: !!inputs.allowsTeamPreferences,
      preferGradeLevels: selectedGrades,
      preferGroupFormat: inputs.preferGroupFormat || "either",
      preferClassType: selectedClassTypes,
      status: inputs.status || "draft",
      // CUSP capstone fields
      sponsorIsMentor: !!inputs.sponsorIsMentor,
      mentorNotes: inputs.mentorNotes || "",
      researchQuestion: inputs.researchQuestion || "",
      relevance: inputs.relevance || "",
      dataRequirements: inputs.dataRequirements || "",
      backgroundMethodology: inputs.backgroundMethodology || "",
      dataSecurityConcerns: inputs.dataSecurityConcerns || "no",
      dataSecurityNotes: inputs.dataSecurityNotes || "",
      techRequirements: inputs.techRequirements || "",
      fieldWorkLikelihood: Number(inputs.fieldWorkLikelihood) || null,
      competencies: inputs.competencies || "",
      learningOutcomes: inputs.learningOutcomes || "",
      relevantLinks: relevantLinks.length ? relevantLinks : null,
      additionalNotes: inputs.additionalNotes || "",
      guidelinesAcknowledged: !!inputs.guidelinesAcknowledged,
      // Stamp the acknowledgement time on first tick (audit trail).
      guidelinesAcknowledgedAt:
        inputs.guidelinesAcknowledged &&
        !opportunity?.guidelinesAcknowledgedAt
          ? new Date().toISOString()
          : opportunity?.guidelinesAcknowledgedAt || null,
      requestsAppointment: !!inputs.requestsAppointment,
      // Special considerations
      specialConsiderations: inputs.specialConsiderations || "",
      designedForSpecificStudents: inputs.designedForSpecificStudents || "",
      anticipatedObstacles: inputs.anticipatedObstacles || "",
      requiresBusinessHours: inputs.requiresBusinessHours || "",
      privateClientDataNotes: inputs.privateClientDataNotes || "",
      fieldResearchTravelDetails: inputs.fieldResearchTravelDetails || "",
      expectedDeliverables: inputs.expectedDeliverables || "",
      // Post-acceptance details
      scopeDescription: inputs.scopeDescription || "",
      issueRelevance: inputs.issueRelevance || "",
      potentialActivities: inputs.potentialActivities || "",
      specificSkills: inputs.specificSkills || "",
      // Auto-stamp the acceptance time when status first transitions to
      // "accepted" (this typically happens via an admin tool, but if it's
      // set in the editor we still mark the moment).
      acceptedAt:
        inputs.status === "accepted" && !opportunity?.acceptedAt
          ? new Date().toISOString()
          : opportunity?.acceptedAt || null,
      preSelectedAt:
        inputs.status === "pre_selected" && !opportunity?.preSelectedAt
          ? new Date().toISOString()
          : opportunity?.preSelectedAt || null,
    };

    // Only include the upload fields when the user actually picked a new file.
    // Keystone rejects an empty image/file input object.
    if (coverImageUpload) {
      baseInput.coverImage = { upload: coverImageUpload };
    }
    if (videoFileUpload) {
      baseInput.videoFile = { upload: videoFileUpload };
    }

    if (isNew) {
      const { data: created } = await createOpportunity({
        variables: {
          input: {
            ...baseInput,
            ...(user?.id
              ? { mentor: { connect: { id: user.id } } }
              : {}),
            classNetworks: networkConnect.length
              ? { connect: networkConnect }
              : undefined,
            // Auto-attach the sponsor's organization (if any) so students
            // see the institutional identity on the opportunity card.
            organization: myOrganizationId
              ? { connect: { id: myOrganizationId } }
              : undefined,
          },
        },
      });
      if (created?.createOpportunity?.id) {
        router.replace({
          pathname: "/dashboard/connect/opportunities",
        });
      }
    } else {
      await updateOpportunity({
        variables: {
          id: opportunityId,
          input: {
            ...baseInput,
            classNetworks: { set: networkConnect },
            updatedAt: new Date().toISOString(),
          },
        },
      });
      router.replace({
        pathname: "/dashboard/connect/opportunities",
      });
    }
  };

  const handleCancel = () => {
    if (isReviewMode) {
      router.replace({
        pathname: "/dashboard/connect/opportunities",
        query: { tab: "review" },
      });
      return;
    }
    router.replace({ pathname: "/dashboard/connect/opportunities" });
  };

  const notifySponsor = async ({ titleKey, messageKey, defaultTitle, defaultMessage }) => {
    const mentorId = opportunity?.mentor?.id;
    if (!mentorId) return;
    const link = `/dashboard/connect/opportunities?op=${opportunityId}`;
    try {
      await sendEmail({
        receiverId: mentorId,
        title: t(titleKey, {}, { default: defaultTitle }),
        message: t(messageKey, {}, { default: defaultMessage }),
        link,
      });
    } catch (e) {
      console.error("Opportunity review notification failed:", e);
    }
  };

  const handleReviewAction = async (nextStatus) => {
    if (nextStatus === "pre_selected") {
      if (
        !window.confirm(
          t("opportunityEditor.review.preSelectConfirm", {}, {
            default:
              "Pre-select this sponsor? They will be notified to complete the follow-up questionnaire.",
          }),
        )
      ) {
        return;
      }
    } else if (nextStatus === "accepted") {
      if (!inputs.potentialActivities?.trim() || !inputs.specificSkills?.trim()) {
        alert(
          t("opportunityEditor.review.followUpIncomplete", {}, {
            default:
              "The sponsor must complete the follow-up questionnaire before you can accept.",
          }),
        );
        return;
      }
      if (
        !window.confirm(
          t("opportunityEditor.review.acceptConfirm", {}, {
            default:
              "Accept this proposal? The sponsor will be notified to complete the final scope.",
          }),
        )
      ) {
        return;
      }
    } else if (nextStatus === "published") {
      if (!inputs.scopeDescription?.trim()) {
        alert(
          t("opportunityEditor.review.scopeIncomplete", {}, {
            default:
              "The sponsor must complete the project scope before you can publish.",
          }),
        );
        return;
      }
      if (
        !window.confirm(
          t("opportunityEditor.review.publishConfirm", {}, {
            default: "Publish this opportunity so students can see it?",
          }),
        )
      ) {
        return;
      }
    }

    const reviewInput = {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      preSelectedAt:
        nextStatus === "pre_selected" && !opportunity?.preSelectedAt
          ? new Date().toISOString()
          : opportunity?.preSelectedAt || null,
      acceptedAt:
        nextStatus === "accepted" && !opportunity?.acceptedAt
          ? new Date().toISOString()
          : opportunity?.acceptedAt || null,
      reviewedBy: user?.id ? { connect: { id: user.id } } : undefined,
    };

    await updateOpportunity({
      variables: {
        id: opportunityId,
        input: reviewInput,
      },
    });

    if (nextStatus === "pre_selected") {
      await notifySponsor({
        titleKey: "opportunityEditor.review.emailPreSelectTitle",
        messageKey: "opportunityEditor.review.emailPreSelectMessage",
        defaultTitle: "Your Capstone proposal was pre-selected",
        defaultMessage:
          "A teacher has pre-selected your Capstone proposal. Please log in to complete the follow-up questionnaire.",
      });
      alert(
        t("opportunityEditor.review.preSelectSuccess", {}, {
          default: "Sponsor pre-selected and notified.",
        }),
      );
    } else if (nextStatus === "accepted") {
      await notifySponsor({
        titleKey: "opportunityEditor.review.emailAcceptTitle",
        messageKey: "opportunityEditor.review.emailAcceptMessage",
        defaultTitle: "Your Capstone proposal was accepted",
        defaultMessage:
          "Your Capstone proposal has been accepted. Please log in to complete the final project scope.",
      });
      alert(
        t("opportunityEditor.review.acceptSuccess", {}, {
          default: "Proposal accepted and sponsor notified.",
        }),
      );
    } else if (nextStatus === "published") {
      alert(
        t("opportunityEditor.review.publishSuccess", {}, {
          default: "Opportunity published.",
        }),
      );
    }

    handleMultipleUpdate({ status: nextStatus });
  };

  if (!isNew && loadingOpportunity && !opportunity) {
    return (
      <Shell>
        <p>{t("opportunityEditor.loading", {}, { default: "Loading opportunity…" })}</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar>
        <div>
          <BackLink type="button" onClick={handleCancel}>
            <Icon name="arrow left" />{" "}
            {isReviewMode
              ? t("opportunityEditor.review.backLink", {}, {
                  default: "Back to review queue",
                })
              : t("opportunityEditor.backLink", {}, {
                  default: "Back to opportunities",
                })}
          </BackLink>
          <h1>
            {isReviewMode
              ? t("opportunityEditor.review.pageTitle", {}, {
                  default: "Review opportunities",
                })
              : isNew
              ? t("opportunityEditor.pageTitleNew", {}, {
                  default: "New opportunity",
                })
              : t("opportunityEditor.pageTitleEdit", {}, {
                  default: "Edit opportunity",
                })}
          </h1>
        </div>
      </TopBar>

      {isReviewMode && (
        <StatusBanner variant="info">
          {t("opportunityEditor.review.modeBanner", {}, {
            default: "You are reviewing this opportunity as a teacher.",
          })}
        </StatusBanner>
      )}

      <Card>
        <h2>
          {t("opportunityEditor.projectBasics", {}, { default: "Project basics" })}
        </h2>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.projectTitle", {}, { default: "Project Title" })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.projectTitleDescription", {}, {
              default: "15 words maximum. Tips: Be engaging for student appeal",
            })}
          </span>
          <input
            type="text"
            name="title"
            value={inputs.title}
            onChange={handleChange}
            disabled={fieldDisabled}
            placeholder={t("opportunityEditor.projectTitlePlaceholder", {}, {
              default: "e.g. Neuroscience summer mentorship",
            })}
          />
          <WordHint value={inputs.title} max={WORD_LIMITS.title} />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.projectAbstract", {}, {
              default: "Capstone Project Abstract",
            })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.projectAbstractDescription", {}, {
              default: "100 words maximum.",
            })}
          </span>
          <textarea
            name="shortDescription"
            value={inputs.shortDescription}
            onChange={handleChange}
            disabled={fieldDisabled}
          />
          <WordHint value={inputs.shortDescription} max={WORD_LIMITS.shortDescription} />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.categorization", {}, { default: "Classification" })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.categorizationDescription", {}, {
              default: "Which category does your project align with?",
            })}
          </span>
          <CheckboxRow>
            {CATEGORY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={inputs.projectCategory === opt.value ? "active" : ""}
              >
                <input
                  type="radio"
                  name="projectCategory"
                  checked={inputs.projectCategory === opt.value}
                  disabled={fieldDisabled}
                  onChange={() =>
                    handleMultipleUpdate({ projectCategory: opt.value })
                  }
                />
                {t(`opportunityEditor.categorizationOptions.${opt.key}`, {}, {
                  default: opt.key,
                })}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        {inputs.projectCategory === "other" && (
          <Field>
            <span className="label-text">
              {t("opportunityEditor.categorizationOther", {}, {
                default: "Other category",
              })}
              <RequiredMark />
            </span>
            <input
              type="text"
              name="projectCategoryOther"
              value={inputs.projectCategoryOther}
              onChange={handleChange}
              disabled={fieldDisabled}
            />
          </Field>
        )}
        <Field>
          <span className="label-text">
            {t("opportunityEditor.issueRelevance", {}, {
              default: "Organizational relevance",
            })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.issueRelevanceDescription", {}, {
              default:
                "Why is this challenge of particular relevance to your organization? What are the implications of this issue or problem for your agency? 100 words maximum.",
            })}
          </span>
          <textarea
            name="issueRelevance"
            value={inputs.issueRelevance}
            onChange={handleChange}
            disabled={fieldDisabled}
          />
          <WordHint value={inputs.issueRelevance} max={WORD_LIMITS.issueRelevance} />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.expectedDeliverables", {}, {
              default: "Expected deliverables",
            })}
            <RequiredMark />
          </span>
          <span className="hint">
            {t("opportunityEditor.expectedDeliverablesDescription", {}, {
              default:
                "Please describe the deliverables that are expected of the Capstone Team at the completion of the project. Approximately 250 words.",
            })}
          </span>
          <textarea
            name="expectedDeliverables"
            value={inputs.expectedDeliverables}
            onChange={handleChange}
            disabled={fieldDisabled}
          />
          <WordHint
            value={inputs.expectedDeliverables}
            max={WORD_LIMITS.expectedDeliverables}
          />
        </Field>
      </Card>

      <Card>
        <h2>
          {t("opportunityEditor.specialConsiderations.title", {}, {
            default: "Special considerations",
          })}
        </h2>
        <p style={{ color: "#5f6871", fontSize: 14, margin: 0 }}>
          {t("opportunityEditor.specialConsiderations.intro", {}, {
            default:
              "If applicable, please describe any special considerations that NYU Wagner and/or the Capstone Project Team should be aware of.",
          })}
        </p>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.specialConsiderations.general", {}, {
              default: "Special considerations",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.specialConsiderations.generalHint", {}, {
              default:
                "If applicable, describe anything the Capstone Project Team should be aware of.",
            })}
          </span>
          <textarea
            name="specialConsiderations"
            value={inputs.specialConsiderations}
            onChange={handleChange}
            disabled={fieldDisabled}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.specialConsiderations.designedForStudents", {}, {
              default: "Designed with specific NYU CUSP students in mind?",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.specialConsiderations.designedForStudentsHint", {}, {
              default: "If yes, please list student names. 15 words maximum.",
            })}
          </span>
          <textarea
            name="designedForSpecificStudents"
            value={inputs.designedForSpecificStudents}
            onChange={handleChange}
            disabled={fieldDisabled}
            rows={2}
          />
          <WordHint
            value={inputs.designedForSpecificStudents}
            max={WORD_LIMITS.designedForSpecificStudents}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.specialConsiderations.anticipatedObstacles", {}, {
              default: "Anticipated obstacles",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.specialConsiderations.anticipatedObstaclesHint", {}, {
              default:
                "Can you anticipate obstacles that a Capstone Team might encounter while working on this project? 250 words maximum.",
            })}
          </span>
          <textarea
            name="anticipatedObstacles"
            value={inputs.anticipatedObstacles}
            onChange={handleChange}
            disabled={fieldDisabled}
          />
          <WordHint
            value={inputs.anticipatedObstacles}
            max={WORD_LIMITS.anticipatedObstacles}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.specialConsiderations.requiresBusinessHours", {}, {
              default: "Research during business hours?",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.specialConsiderations.requiresBusinessHoursHint", {}, {
              default:
                "Must a significant portion of research and data gathering be done during regular business hours? 50 words maximum.",
            })}
          </span>
          <textarea
            name="requiresBusinessHours"
            value={inputs.requiresBusinessHours}
            onChange={handleChange}
            disabled={fieldDisabled}
            rows={3}
          />
          <WordHint
            value={inputs.requiresBusinessHours}
            max={WORD_LIMITS.requiresBusinessHours}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.specialConsiderations.privateClientData", {}, {
              default: "Private client data access",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.specialConsiderations.privateClientDataHint", {}, {
              default:
                "Will the Capstone Team have access to private client data? 100 words maximum.",
            })}
          </span>
          <textarea
            name="privateClientDataNotes"
            value={inputs.privateClientDataNotes}
            onChange={handleChange}
            disabled={fieldDisabled}
          />
          <WordHint
            value={inputs.privateClientDataNotes}
            max={WORD_LIMITS.privateClientDataNotes}
          />
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.specialConsiderations.fieldResearchTravel", {}, {
              default: "Field research and travel",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.specialConsiderations.fieldResearchTravelHint", {}, {
              default:
                "Will the Capstone Team be required to conduct field research and/or visit multiple locations? 250 words maximum.",
            })}
          </span>
          <textarea
            name="fieldResearchTravelDetails"
            value={inputs.fieldResearchTravelDetails}
            onChange={handleChange}
            disabled={fieldDisabled}
          />
          <WordHint
            value={inputs.fieldResearchTravelDetails}
            max={WORD_LIMITS.fieldResearchTravelDetails}
          />
        </Field>
      </Card>

      {showFollowUp && (
        <Card>
          <h2>
            {t("opportunityEditor.followUpQuestionnaire.title", {}, {
              default: "Follow-up questionnaire",
            })}
          </h2>
          {!isReviewMode && (
            <StatusBanner>
              {t("opportunityEditor.followUpQuestionnaire.banner", {}, {
                default:
                  "You've been pre-selected — please complete the follow-up questions below.",
              })}
            </StatusBanner>
          )}
          <Field>
            <span className="label-text">
              {t("opportunityEditor.followUpQuestionnaire.potentialActivities", {}, {
                default: "Potential activities",
              })}
              <RequiredMark />
            </span>
            <span className="hint">
              {t("opportunityEditor.followUpQuestionnaire.potentialActivitiesHint", {}, {
                default:
                  "Please describe potential activities in which the Capstone Team might engage. 500 words maximum.",
              })}
            </span>
            <textarea
              name="potentialActivities"
              value={inputs.potentialActivities}
              onChange={handleChange}
              disabled={fieldDisabled}
            />
            <WordHint
              value={inputs.potentialActivities}
              max={WORD_LIMITS.potentialActivities}
            />
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.followUpQuestionnaire.specificSkills", {}, {
                default: "Specific skills or qualifications",
              })}
              <RequiredMark />
            </span>
            <span className="hint">
              {t("opportunityEditor.followUpQuestionnaire.specificSkillsHint", {}, {
                default:
                  "Specific skills or qualifications that would be helpful for the Capstone Team. 500 words maximum.",
              })}
            </span>
            <textarea
              name="specificSkills"
              value={inputs.specificSkills}
              onChange={handleChange}
              disabled={fieldDisabled}
            />
            <WordHint value={inputs.specificSkills} max={WORD_LIMITS.specificSkills} />
          </Field>
        </Card>
      )}

      {showFinalScope && (
        <Card>
          <h2>
            {t("opportunityEditor.finalScope.title", {}, { default: "Project scope" })}
          </h2>
          {!isReviewMode && (
            <StatusBanner>
              {opportunity?.acceptedAt
                ? t("opportunityEditor.finalScope.bannerDate", {
                    date: new Date(opportunity.acceptedAt).toLocaleDateString(),
                  }, {
                    default: "Your proposal was accepted on {{date}}.",
                  })
                : t("opportunityEditor.finalScope.banner", {}, {
                    default:
                      "You've been accepted — describe the project scope below.",
                  })}
            </StatusBanner>
          )}
          <Field>
            <span className="label-text">
              {t("opportunityEditor.finalScope.scopeDescription", {}, {
                default: "Scope of the project",
              })}
              <RequiredMark />
            </span>
            <span className="hint">
              {t("opportunityEditor.finalScope.scopeDescriptionHint", {}, {
                default:
                  "Describe the scope of the project for which you would like a Capstone Project Team to focus.",
              })}
            </span>
            <textarea
              name="scopeDescription"
              value={inputs.scopeDescription}
              onChange={handleChange}
              disabled={fieldDisabled}
            />
            <WordHint
              value={inputs.scopeDescription}
              max={WORD_LIMITS.scopeDescription}
            />
          </Field>
        </Card>
      )}

      {hasExpandedOpportunityEditor && (
      <Card>
        <h2>{t("opportunityEditor.basics", {}, { default: "Media" })}</h2>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">
              {t("opportunityEditor.coverImage", {}, { default: "Cover image" })}
            </span>
            <span className="hint">
              {t("opportunityEditor.coverImageHint", {}, {
                default:
                  "Upload a file or paste a direct image URL below.",
              })}
            </span>
            {opportunity?.coverImage?.url && !coverImageUpload && (
              <div
                style={{
                  marginBottom: 8,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid #d3dae0",
                  maxWidth: 280,
                }}
              >
                <img
                  src={opportunity.coverImage.url}
                  alt={inputs.title || "Cover"}
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => pickCoverImage(e.target.files?.[0] || null)}
            />
            {coverImageUpload && (
              <div style={{ fontSize: 12, color: "#1d8f47", marginTop: 4 }}>
                Ready to upload: {coverImageUpload.name}
              </div>
            )}
            <input
              type="text"
              name="coverImageUrl"
              value={inputs.coverImageUrl}
              onChange={handleChange}
              placeholder="https://…"
            />
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.introVideo", {}, { default: "Intro video" })}
            </span>
            <span className="hint">
              {t("opportunityEditor.introVideoHint", {}, {
                default: "Upload a video file or paste an embed URL.",
              })}
            </span>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => pickVideoFile(e.target.files?.[0] || null)}
            />
            <input
              type="text"
              name="videoUrl"
              value={inputs.videoUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=…"
            />
          </Field>
        </Row>
      </Card>
      )}

      {hasExpandedOpportunityEditor && (
      <Card>
        <h2>
          {t("opportunityEditor.availabilityCapacity", {}, {
            default: "Availability & capacity",
          })}
        </h2>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">
              {t("opportunityEditor.availableFrom", {}, { default: "Available from" })}
            </span>
            <input
              type="date"
              name="availableFrom"
              value={inputs.availableFrom}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.availableTo", {}, { default: "Available to" })}
            </span>
            <input
              type="date"
              name="availableTo"
              value={inputs.availableTo}
              onChange={handleChange}
            />
          </Field>
        </Row>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.timeCommitment", {}, { default: "Time commitment" })}
          </span>
          <input
            type="text"
            name="timeCommitment"
            value={inputs.timeCommitment}
            onChange={handleChange}
            placeholder={t("opportunityEditor.timeCommitmentPlaceholder", {}, {
              default: "e.g. 3 hours per week for 8 weeks",
            })}
          />
        </Field>
        <Row $cols="1fr 1fr 1fr">
          <Field>
            <span className="label-text">
              {t("opportunityEditor.studentCapacity", {}, { default: "Student capacity" })}
            </span>
            <input
              type="number"
              name="studentCapacity"
              min="1"
              value={inputs.studentCapacity}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.teamSize", {}, { default: "Team size" })}
            </span>
            <span className="hint">
              {t("opportunityEditor.teamSizeHint", {}, { default: "1 = solo placement." })}
            </span>
            <input
              type="number"
              name="teamSize"
              min="1"
              value={inputs.teamSize}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">
              {t("opportunityEditor.groupFormat", {}, { default: "Group format" })}
            </span>
            <Dropdown
              selection
              options={GROUP_FORMAT_OPTIONS}
              value={inputs.preferGroupFormat}
              onChange={(_, { value }) =>
                handleMultipleUpdate({ preferGroupFormat: value })
              }
            />
          </Field>
        </Row>
        <Field>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="allowsTeamPreferences"
              checked={!!inputs.allowsTeamPreferences}
              onChange={toggleBoolean}
            />
            <span>
              {t("opportunityEditor.teamPreferences", {}, {
                default:
                  "Allow students to nominate preferred teammates for this opportunity",
              })}
            </span>
          </label>
        </Field>
      </Card>
      )}

      {hasExpandedOpportunityEditor && (
      <Card>
        <h2>
          {t("opportunityEditor.audiencePreferences", {}, {
            default: "Audience preferences",
          })}
        </h2>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.preferredGrades", {}, {
              default: "Preferred grade levels",
            })}
          </span>
          <CheckboxRow>
            {GRADE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={selectedGrades.includes(opt.value) ? "active" : ""}
              >
                <input
                  type="checkbox"
                  checked={selectedGrades.includes(opt.value)}
                  onChange={() => toggleGrade(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.preferredClassTypes", {}, {
              default: "Preferred class types",
            })}
          </span>
          <CheckboxRow>
            {CLASS_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={
                  selectedClassTypes.includes(opt.value) ? "active" : ""
                }
              >
                <input
                  type="checkbox"
                  checked={selectedClassTypes.includes(opt.value)}
                  onChange={() => toggleClassType(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.offeredInNetworks", {}, {
              default: "Offered in class networks",
            })}
          </span>
          <span className="hint">
            {t("opportunityEditor.offeredInNetworksHint", {}, {
              default: "Pick which networks can see this opportunity.",
            })}
          </span>
          <Dropdown
            placeholder="Select class networks"
            fluid
            multiple
            selection
            search
            options={allNetworks.map((n) => ({
              key: n.id,
              text: n.title,
              value: n.id,
            }))}
            value={selectedNetworks}
            onChange={(_, { value }) => setSelectedNetworks(value)}
          />
        </Field>
      </Card>
      )}

      {hasExpandedOpportunityEditor && (
      <Card>
        <Field>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="sponsorIsMentor"
              checked={!!inputs.sponsorIsMentor}
              onChange={toggleBoolean}
            />
            <span>
              {t("opportunityEditor.sponsorIsMentor", {}, {
                default:
                  "I'm also the day-to-day mentor for this project (uncheck if someone else will be mentoring)",
              })}
            </span>
          </label>
        </Field>
        {!inputs.sponsorIsMentor && (
          <Field>
            <span className="label-text">
              {t("opportunityEditor.mentorNotes", {}, { default: "Mentor notes" })}
            </span>
            <span className="hint">
              {t("opportunityEditor.mentorNotesDescription", {}, {
                default:
                  "Name, title, contact, and availability of the day-to-day mentor. If no mentor is available, describe the gaps and CUSP can help identify support.",
              })}
            </span>
            <textarea
              name="mentorNotes"
              value={inputs.mentorNotes}
              onChange={handleChange}
            />
          </Field>
        )}
      </Card>
      )}

      {hasExpandedOpportunityEditor && (
      <Card>
        <h2>
          {t("opportunityEditor.customQuestions.title", {}, {
            default: "Custom application questions",
          })}
        </h2>
        <p style={{ color: "#5f6871", fontSize: 14, margin: 0 }}>
          {t("opportunityEditor.customQuestions.description", {}, {
            default:
              "Optional questions students answer when they rank this opportunity. Used by the matching algorithm.",
          })}
        </p>
        {isNew ? (
          <p style={{ color: "#5f6871", fontSize: 14 }}>
            {t("opportunityEditor.customQuestions.saveFirst", {}, {
              default:
                "Save the opportunity first, then come back here to add custom questions.",
            })}
          </p>
        ) : (
          <>
            {opportunityQuestions.length > 0 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {opportunityQuestions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 12,
                      border: "1px solid #d3dae0",
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#171717" }}>
                        {q.prompt}
                      </div>
                      <div style={{ color: "#5f6871", fontSize: 12 }}>
                        {q.questionType}
                        {q.isRequired ? " · required" : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 100,
                        border: "1px solid #e8c4c4",
                        background: "#fff",
                        color: "#b3261e",
                        fontFamily: "Nunito",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {t("opportunityEditor.customQuestions.delete", {}, {
                        default: "Delete",
                      })}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                marginTop: 12,
                padding: 16,
                border: "1px dashed #d3dae0",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <strong style={{ color: "#171717" }}>
                {t("opportunityEditor.customQuestions.addPrompt", {}, {
                  default: "Add a question",
                })}
              </strong>
              <Field>
                <span className="label-text">
                  {t("opportunityEditor.customQuestions.prompt", {}, {
                    default: "Prompt",
                  })}
                </span>
                <input
                  type="text"
                  value={questionDraft.prompt}
                  onChange={(e) =>
                    setQuestionDraft({
                      ...questionDraft,
                      prompt: e.target.value,
                    })
                  }
                  placeholder={t(
                    "opportunityEditor.customQuestions.promptPlaceholder",
                    {},
                    { default: "e.g. Why are you interested in this project?" },
                  )}
                />
              </Field>
              <Field>
                <span className="label-text">
                  {t("opportunityEditor.customQuestions.questionType", {}, {
                    default: "Question type",
                  })}
                </span>
                <Dropdown
                  selection
                  options={[
                    { key: "short_text", text: "Short text", value: "short_text" },
                    {
                      key: "long_text",
                      text: "Long text",
                      value: "long_text",
                    },
                    {
                      key: "single_select",
                      text: "Single select",
                      value: "single_select",
                    },
                    {
                      key: "multi_select",
                      text: "Multi select",
                      value: "multi_select",
                    },
                  ]}
                  value={questionDraft.questionType}
                  onChange={(_, { value }) =>
                    setQuestionDraft({ ...questionDraft, questionType: value })
                  }
                />
              </Field>
              {SELECT_TYPES.includes(questionDraft.questionType) && (
                <Field>
                  <span className="label-text">
                    {t("opportunityEditor.customQuestions.options", {}, {
                      default: "Options (one per line)",
                    })}
                  </span>
                  <textarea
                    value={questionDraft.optionsText}
                    onChange={(e) =>
                      setQuestionDraft({
                        ...questionDraft,
                        optionsText: e.target.value,
                      })
                    }
                  />
                </Field>
              )}
              <label
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!questionDraft.isRequired}
                  onChange={(e) =>
                    setQuestionDraft({
                      ...questionDraft,
                      isRequired: e.target.checked,
                    })
                  }
                />
                <span>
                  {t("opportunityEditor.customQuestions.isRequired", {}, {
                    default: "Required",
                  })}
                </span>
              </label>
              <div>
                <Button
                  type="button"
                  $primary
                  onClick={handleAddQuestion}
                  disabled={addingQuestion}
                >
                  {addingQuestion
                    ? t("opportunityEditor.saving", {}, { default: "Saving…" })
                    : t("opportunityEditor.customQuestions.add", {}, {
                        default: "Add question",
                      })}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
      )}

      {isReviewMode && (
        <Card>
          <h2>
            {t("opportunityEditor.review.pageTitle", {}, {
              default: "Review opportunities",
            })}
          </h2>
          <Actions style={{ justifyContent: "flex-start" }}>
            {inputs.status === "pending_review" && (
              <Button
                type="button"
                $primary
                onClick={() => handleReviewAction("pre_selected")}
                disabled={updating}
              >
                {t("opportunityEditor.review.preSelect", {}, {
                  default: "Pre-select sponsor",
                })}
              </Button>
            )}
            {inputs.status === "pre_selected" && (
              <Button
                type="button"
                $primary
                onClick={() => handleReviewAction("accepted")}
                disabled={updating}
              >
                {t("opportunityEditor.review.accept", {}, {
                  default: "Accept proposal",
                })}
              </Button>
            )}
            {inputs.status === "accepted" && (
              <Button
                type="button"
                $primary
                onClick={() => handleReviewAction("published")}
                disabled={updating}
              >
                {t("opportunityEditor.review.publish", {}, {
                  default: "Publish opportunity",
                })}
              </Button>
            )}
          </Actions>
        </Card>
      )}

      {!isReviewMode && (
      <Card>
        <h2>{t("opportunityEditor.publishing", {}, { default: "Publishing" })}</h2>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.status", {}, { default: "Status" })}
          </span>
          {!isAdmin && ADMIN_ONLY_STATUSES.has(inputs.status) ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#f7f9f8",
                border: "1px solid #d3dae0",
                color: "#171717",
                fontSize: 14,
              }}
            >
              <Icon name="lock" />
              <strong style={{ textTransform: "capitalize" }}>
                {inputs.status.replace("_", " ")}
              </strong>
              <span style={{ color: "#5f6871", fontSize: 13 }}>
                {t("opportunityEditor.sponsorStatusLocked", {}, {
                  default:
                    "— locked. A teacher or admin will update the status.",
                })}
              </span>
            </div>
          ) : (
            <Dropdown
              selection
              options={statusOptions}
              value={inputs.status}
              onChange={(_, { value }) =>
                handleMultipleUpdate({ status: value })
              }
            />
          )}
          {!isAdmin && !isTeacher && (
            <span className="hint" style={{ marginTop: 4 }}>
              {t("opportunityEditor.sponsorStatusHint", {}, {
                default:
                  "Set to Submitted for review when your proposal is ready — a teacher will review it.",
              })}
            </span>
          )}
        </Field>
        <Field>
          <span className="label-text">
            {t("opportunityEditor.guidelinesTitle", {}, {
              default: "Understanding of Proposal Guidelines",
            })}
            <RequiredMark />
          </span>
          <span style={{ fontSize: 14, color: "#171717", lineHeight: 1.5 }}>
            {t("opportunityEditor.guidelinesDescription", {}, {
              default:
                "I have read and understood the Capstone proposal guidelines in full, including all of the Capstone Sponsor FAQs and Mutual Expectations agreement and agree to abide by them.",
            })}
          </span>
          <LinkChipRow>
            <a
              href="https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects"
              target="_blank"
              rel="noreferrer"
            >
              {t("opportunityEditor.guidelinesFaqsChip", {}, {
                default: "Capstone Sponsor FAQs",
              })}
            </a>
            <a
              href="https://engineering.nyu.edu/research-innovation/centers/cusp/research/capstone-projects/cusp-capstone-mutual-expectations"
              target="_blank"
              rel="noreferrer"
            >
              {t("opportunityEditor.guidelinesMutualExpectationsChip", {}, {
                default: "Mutual Expectations agreement",
              })}
            </a>
          </LinkChipRow>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "flex-start",
              cursor: "pointer",
              fontSize: 14,
              color: "#171717",
            }}
          >
            <input
              type="checkbox"
              name="guidelinesAcknowledged"
              checked={!!inputs.guidelinesAcknowledged}
              onChange={toggleBoolean}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong>
                {t("opportunityEditor.guidelinesAgree", {}, {
                  default: "I agree with this statement.",
                })}
              </strong>
            </span>
          </label>
          {opportunity?.guidelinesAcknowledgedAt && (
            <span className="hint" style={{ marginLeft: 26 }}>
              {t("opportunityEditor.guidelinesAcknowledgedAt", {
                date: new Date(
                  opportunity.guidelinesAcknowledgedAt,
                ).toLocaleString(),
              }, {
                default: "Acknowledged {{date}}",
              })}
            </span>
          )}
        </Field>
        <Field>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "flex-start",
              cursor: "pointer",
              fontSize: 14,
              color: "#171717",
            }}
          >
            <input
              type="checkbox"
              name="requestsAppointment"
              checked={!!inputs.requestsAppointment}
              onChange={toggleBoolean}
              style={{ marginTop: 3 }}
            />
            <span>
              {t("opportunityEditor.guidelinesRequestAppointment", {}, {
                default: "I request an appointment to discuss further.",
              })}
            </span>
          </label>
        </Field>
        {inputs.status !== "draft" && !inputs.guidelinesAcknowledged && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "#fdf1f1",
              border: "1px solid #f1c8c8",
              color: "#b3261e",
              fontSize: 13,
            }}
          >
            <Icon name="warning circle" />{" "}
            {t("opportunityEditor.guidelinesWarning", {}, {
              default:
                "Tick the guidelines checkbox before moving the status away from Draft.",
            })}
          </div>
        )}
      </Card>
      )}

      {!isReviewMode && (
      <Actions>
        <Button type="button" onClick={handleCancel} disabled={saving}>
          {t("opportunityEditor.cancel", {}, { default: "Cancel" })}
        </Button>
        <Button type="button" $primary onClick={handleSave} disabled={saving}>
          {saving
            ? t("opportunityEditor.saving", {}, { default: "Saving…" })
            : isNew
            ? t("opportunityEditor.create", {}, { default: "Create opportunity" })
            : t("opportunityEditor.save", {}, { default: "Save changes" })}
        </Button>
      </Actions>
      )}
    </Shell>
  );
}
